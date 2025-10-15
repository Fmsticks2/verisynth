// Netlify Function: Proxy Pinata JSON uploads to avoid browser CORS and protect secrets
// Uses Node 18 global fetch and expects PINATA_JWT to be set in Netlify environment

/**
 * Expected request body (JSON):
 * {
 *   data: object,              // JSON object to pin
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
    const { data, filename, metadata, groupId } = body;

    if (!data) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required field: data' }),
      };
    }

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

    const pinPayload = {
      pinataContent: data,
      pinataMetadata: {
        name: (metadata && metadata.name) || filename || 'dataset.json',
        keyvalues: limitKeyvalues((metadata && metadata.keyvalues) || {}, 10),
      },
      // Pinata options can be extended here if needed
    };

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      headers.pinata_api_key = apiKey;
      headers.pinata_secret_api_key = apiSecret;
    }

    const resp = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers,
      body: JSON.stringify(pinPayload),
    });

    const text = await resp.text();
    if (!resp.ok) {
      // Auto-retry with empty keyvalues if Pinata complains about metadata limit
      const isMetaLimitError = /maximum of 10 key values/i.test(text);
      if (isMetaLimitError) {
        const retryPayload = {
          ...pinPayload,
          pinataMetadata: {
            ...pinPayload.pinataMetadata,
            keyvalues: {},
          },
        };

        const retryResp = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
          method: 'POST',
          headers,
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
    const pinSize = json.PinSize || 0;

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