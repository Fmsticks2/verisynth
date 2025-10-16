// Netlify Function: Proxy Pinata uploads to avoid browser CORS and protect secrets
// Uses Node 18 global fetch and expects PINATA_JWT to be set in Netlify environment

/**
 * Expected request body (JSON):
 * {
 *   // JSON upload (pinJSONToIPFS)
 *   data?: object,             // JSON object to pin
 *   // File upload (pinFileToIPFS)
 *   fileBase64?: string,       // base64 string or data URL of file (images supported)
 *   filename?: string,         // optional display name
 *   metadata?: {               // optional Pinata metadata
 *     name?: string,
 *     keyvalues?: Record<string, string | number>
 *   },
 *   groupId?: string           // optional Pinata group ID
 * }
 */

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const token = process.env.PINATA_JWT || process.env.VITE_PINATA_JWT;
    const apiKey = process.env.PINATA_API_KEY || process.env.VITE_PINATA_API_KEY;
    const apiSecret = process.env.PINATA_SECRET_API_KEY || process.env.VITE_PINATA_SECRET_API_KEY;
    if (!token && !(apiKey && apiSecret)) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Server misconfigured: provide PINATA_JWT or PINATA_API_KEY & PINATA_SECRET_API_KEY' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { data, fileBase64, filename, metadata, groupId } = body;
    // Track JSON payload for potential retry on metadata keyvalues error
    let pinPayload = null;

    // Build pinJSONToIPFS payload
    // Enforce max 10 keyvalues per Pinata constraints
    const limitKeyvalues = (kv = {}, max = 10) => {
      const keys = Object.keys(kv);
      const out = {};
      for (const key of keys.slice(0, max)) {
        out[key] = kv[key];
      }
      return out;
    };

    // Build headers (auth only; Content-Type is set by fetch when using FormData)
    const authHeaders = {};
    if (token) {
      authHeaders.Authorization = `Bearer ${token}`;
    } else {
      authHeaders.pinata_api_key = apiKey;
      authHeaders.pinata_secret_api_key = apiSecret;
    }

    let resp;
    if (fileBase64) {
      // pinFileToIPFS path for images/files
      // Convert base64/data URL to buffer and mime
      let base64 = String(fileBase64);
      let mime = 'application/octet-stream';
      if (base64.startsWith('data:')) {
        const parts = base64.split(',');
        const header = parts[0] || '';
        base64 = parts[1] || '';
        const m = header.match(/^data:(.*?);base64$/);
        if (m && m[1]) mime = m[1];
      }
      const buf = Buffer.from(base64, 'base64');

      const form = new FormData();
      const name = (metadata && metadata.name) || filename || 'upload';
      const displayName = filename || name || 'upload';
      const blob = new Blob([buf], { type: mime });
      form.append('file', blob, displayName);
      form.append('pinataMetadata', JSON.stringify({
        name: name,
        keyvalues: limitKeyvalues((metadata && metadata.keyvalues) || {}, 10),
      }));
      // Optional pinataOptions if needed
      // form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

      resp = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: authHeaders,
        body: form,
      });
    } else if (data) {
      // pinJSONToIPFS path for JSON objects
      pinPayload = {
        pinataContent: data,
        pinataMetadata: {
          name: (metadata && metadata.name) || filename || 'dataset.json',
          keyvalues: limitKeyvalues((metadata && metadata.keyvalues) || {}, 10),
        },
      };
      resp = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(pinPayload),
      });
    } else {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required field: fileBase64 or data' }),
      };
    }

    const text = await resp.text();
    if (!resp.ok) {
      // Auto-retry with empty keyvalues if Pinata complains about metadata limit
      const isMetaLimitError = /maximum of 10 key values/i.test(text);
      if (isMetaLimitError && pinPayload) {
        const retryPayload = {
          ...pinPayload,
          pinataMetadata: {
            ...pinPayload.pinataMetadata,
            keyvalues: {},
          },
        };

        const retryResp = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(retryPayload),
        });
        const retryText = await retryResp.text();
        if (!retryResp.ok) {
          return {
            statusCode: retryResp.status,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: `Pinata upload failed after retry: ${retryText}` }),
          };
        }

        let retryJson;
        try {
          retryJson = JSON.parse(retryText);
        } catch (e) {
          return {
            statusCode: 502,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Invalid response from Pinata on retry' }),
          };
        }
        const retryCid = retryJson.IpfsHash || retryJson.cid || retryJson.hash;
        const retrySize = retryJson.PinSize || 0;
        const normalizeGatewayHost = (raw) => {
          let s = (raw || 'gateway.pinata.cloud').trim();
          const dbl = s.indexOf('//');
          if (dbl !== -1) s = s.slice(dbl + 2);
          s = s.replace(/^\/+/, '').replace(/\/+$/, '');
          if (s.includes('/')) s = s.split('/')[0];
          return s || 'gateway.pinata.cloud';
        };
        const retryGatewayHost = normalizeGatewayHost(process.env.PINATA_GATEWAY_URL);
        const retryUrl = `https://${retryGatewayHost}/ipfs/${retryCid}`;
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cid: retryCid, url: retryUrl, size: retrySize, id: retryJson.id || undefined, groupId, metaTrimmed: true }),
        };
      }

      return {
        statusCode: resp.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Pinata upload failed: ${text}` }),
      };
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid response from Pinata' }),
      };
    }

    const cid = json.IpfsHash || json.cid || json.hash;
    const pinSize = json.PinSize || json.size || 0;

    const normalizeGatewayHost = (raw) => {
      let s = (raw || 'gateway.pinata.cloud').trim();
      const dbl = s.indexOf('//');
      if (dbl !== -1) s = s.slice(dbl + 2);
      s = s.replace(/^\/+/, '').replace(/\/+$/, '');
      if (s.includes('/')) s = s.split('/')[0];
      return s || 'gateway.pinata.cloud';
    };
    const gatewayHost = normalizeGatewayHost(process.env.PINATA_GATEWAY_URL);
    const url = `https://${gatewayHost}/ipfs/${cid}`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cid, url, size: pinSize, id: json.id || undefined, groupId }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err && err.message ? err.message : 'Internal server error' }),
    };
  }
};