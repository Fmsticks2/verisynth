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

    const gateway = process.env.PINATA_GATEWAY_URL || 'gateway.pinata.cloud';
    const url = `https://${gateway}/ipfs/${cid}`;

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