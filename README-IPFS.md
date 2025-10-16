# IPFS Integration

This document explains how VeriSynth integrates IPFS via Pinata. Uploads are performed through a secure Netlify Function proxy to avoid CORS and protect credentials. Client-side operations focus on JSON-only uploads, CID verification, and metadata management.

## Features
- JSON dataset upload with secure metadata via server proxy
- Optional post-upload verification and CID existence checks
- Pinata Groups management helpers
- Client-side rate limiting and input validation
- Comprehensive error handling

## File Structure
```
frontend/src/utils/
├── ipfsUpload.ts          # Upload via Netlify proxy (JSON-only)
├── ipfsVerification.ts    # CID validation and integrity checks
├── pinataGroups.ts        # Pinata Groups helpers
├── pinataConfig.ts        # Client-side config, rate limiter, validation
├── ipfsTest.ts            # Test suite
└── index.ts               # Utility exports

netlify/functions/
└── pinata-upload.js       # Server proxy for pinJSONToIPFS
```

## Configuration

### Environment Variables

Client (`frontend/.env`):
```env
# Gateway host used for reads and verification
VITE_PINATA_GATEWAY_URL=gateway.pinata.cloud
```

Server (Netlify dashboard → Site settings → Environment variables):
```text
# One of the following is required
PINATA_JWT=<pinata_jwt>
# or
PINATA_API_KEY=<pinata_api_key>
PINATA_SECRET_API_KEY=<pinata_secret>

# Optional, used to construct public URLs
PINATA_GATEWAY_URL=gateway.pinata.cloud
```

## Usage Examples

### Basic JSON Upload
```typescript
import { uploadToIPFS } from './utils/ipfsUpload';

// Example JSON payload (object)
const payload = {
  title: 'Example dataset',
  records: [{ id: 1, value: 'a' }, { id: 2, value: 'b' }],
};

const result = await uploadToIPFS(payload, {
  filename: 'dataset.json',
  metadata: {
    name: 'Example Dataset',
    keyvalues: { type: 'dataset', version: '1.0.0' },
  },
  verify: true,
});

console.log('CID:', result.cid);
console.log('Gateway URL:', result.url);
console.log('Verified:', result.verified);
```

### Dataset Upload
```typescript
import { uploadDatasetToIPFS } from './utils/ipfsUpload';

const dataset = {
  metadata: { topic: 'users', modelVersion: 'v1' },
  data: [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ],
  hash: 'sha256-hex-string',
};

const result = await uploadDatasetToIPFS(dataset, {
  filename: 'users-v1.json',
  metadata: {
    name: 'Users Dataset v1',
    keyvalues: { type: 'dataset', format: 'json', version: '1.0.0' },
  },
  verify: true,
});
```

### CID Verification
```typescript
import { isValidCID, verifyCIDExists, verifyFileIntegrity } from './utils/ipfsVerification';

const cid = 'bafy...';
if (isValidCID(cid)) {
  const exists = await verifyCIDExists(cid);
  console.log('CID exists:', exists.exists);

  const integrity = await verifyFileIntegrity(cid);
  console.log('SHA-256 content hash:', integrity.calculatedHash);
}
```

### Groups Management
```typescript
import { createGroup, addFilesToGroup, listGroups } from './utils/pinataGroups';

// Create a group (requires server-side credentials)
const group = await createGroup({ name: 'My Dataset Group', isPublic: false });

// Add CID(s) to group
await addFilesToGroup(group.id, [{ cid: 'bafy...', name: 'users-v1.json' }]);

// List all groups
const groups = await listGroups();
```

### Smart Upload with Fallback
```typescript
import { smartUploadToIPFS } from './utils/ipfsUpload';

const result = await smartUploadToIPFS({ hello: 'world' }, {
  filename: 'hello.json',
  metadata: { name: 'Smart Upload Test', keyvalues: { env: 'dev' } },
});

// Automatically handles server errors and provides clear messages
```

## Testing
```typescript
import { runQuickTest } from './utils/ipfsTest';
await runQuickTest();
```

```typescript
import { IPFSTestSuite } from './utils/ipfsTest';
const suite = new IPFSTestSuite();
await suite.runAllTests();
```

## Security

### Rate Limiting
- Client-side limiter: default 10 calls/minute

### Input Validation
- Filename sanitization, file size checks, CID format validation

### Secure Configuration
- Server-side credentials only; client holds gateway host for reads

### Error Handling
- Clear error codes: `RATE_LIMIT_ERROR`, `FILE_SIZE_ERROR`, `SERVER_UPLOAD_ERROR`, `NETWORK_ERROR`

## Error Handling

1. Configuration
   - Server credentials missing: configure `PINATA_JWT` or `PINATA_API_KEY` + `PINATA_SECRET_API_KEY` in Netlify
2. Rate Limiting
   - Wait for limiter window and retry
3. File Validation
   - File too large (client-side approximation)
   - Invalid filename
4. Upload Errors
   - Network issues
   - Pinata API errors surfaced via server proxy

## Monitoring and Debugging

### Logging
- Client logs key events and warnings in development. Use browser DevTools.

### Local Functions
- Use `netlify dev` to run functions locally and inspect logs.

## Migration Guide

1. Update imports to `./utils/ipfsUpload` and `./utils/ipfsVerification`.
2. Use object-based options (`{ filename, metadata, verify }`).
3. Handle return `{ cid, url, size, verified }`.

## Best Practices

### File Organization
- Use consistent `keyvalues` schemas; avoid exceeding Pinata’s 10-key limit.

### Performance
- Enable integrity verification only when needed.

### Security
- Keep credentials server-side; do not expose in client env.

### Testing
- Run tests before deployment and validate edge cases.

## Resources
- Pinata Docs: https://docs.pinata.cloud/
- IPFS Docs: https://docs.ipfs.io/
- Pinata SDK: https://github.com/PinataCloud/pinata-web3

## Troubleshooting

### Common Issues
1. "Pinata server credentials not configured"
   - Configure `PINATA_JWT` or `PINATA_API_KEY` + `PINATA_SECRET_API_KEY` in Netlify
2. "Rate limit exceeded"
   - Wait for the specified time before retrying
3. "File size exceeds maximum limit"
   - Reduce JSON payload or adjust server limits
4. "Invalid CID format"
   - Verify CID string format

## Future Enhancements
- Batch uploads and progress tracking
- Advanced metadata search and indexing
- Caching strategies and client-side persistence