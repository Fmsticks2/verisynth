# IPFS Integration with Pinata SDK

This document provides a comprehensive guide to the IPFS integration implemented in this project using the Pinata SDK.

## 🚀 Features

### Core Functionality
- **File Upload**: Direct file uploads to IPFS via Pinata
- **Dataset Upload**: Structured dataset uploads with metadata
- **File Verification**: CID validation and integrity checking
- **Groups Management**: Organize files using Pinata Groups
- **Metadata Support**: Rich metadata and keyvalues for file organization
- **Security**: Rate limiting, input validation, and secure configuration
- **Error Handling**: Comprehensive error handling and fallback mechanisms

### New Capabilities Added
1. **CID-based File Verification**: Validate file integrity using IPFS CIDs
2. **Metadata and Keyvalues**: Enhanced file organization and searchability
3. **Pinata Groups**: Dataset organization and management
4. **Security Enhancements**: Rate limiting, input sanitization, secure configuration
5. **Comprehensive Testing**: Full test suite for all functionality

## 📁 File Structure

```
frontend/src/utils/
├── ipfsUpload.ts          # Core upload functionality
├── ipfsVerification.ts    # File verification and integrity checking
├── pinataGroups.ts        # Groups management
├── pinataConfig.ts        # Configuration and security utilities
├── ipfsTest.ts           # Comprehensive test suite
└── index.ts              # Utility exports
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required: Pinata JWT Token
VITE_PINATA_JWT=your_pinata_jwt_token_here

# Optional: Gateway URL
VITE_PINATA_GATEWAY_URL=gateway.pinata.cloud

# Optional: API Key/Secret (JWT takes precedence)
VITE_PINATA_API_KEY=your_pinata_api_key_here
VITE_PINATA_SECRET_API_KEY=your_pinata_secret_key_here

# Optional: File size limit (bytes)
VITE_MAX_FILE_SIZE=104857600  # 100MB

# Optional: Rate limiting
VITE_PINATA_RATE_LIMIT_CALLS=10
VITE_PINATA_RATE_LIMIT_WINDOW=60000

# Development
VITE_ENABLE_IPFS_SIMULATION=false
```

### Getting Pinata Credentials

1. Visit [Pinata Cloud](https://app.pinata.cloud/)
2. Create an account or sign in
3. Go to API Keys section
4. Create a new JWT token with appropriate permissions
5. Copy the JWT token to your `.env` file

## 📚 Usage Examples

### Basic File Upload

```typescript
import { uploadToIPFS } from './utils/ipfsUpload';

const file = new File(['Hello World'], 'hello.txt', { type: 'text/plain' });

const result = await uploadToIPFS(file, {
  metadata: {
    name: 'My File',
    description: 'A simple text file'
  },
  keyvalues: {
    category: 'documents',
    version: '1.0'
  },
  verifyAfterUpload: true
});

if (result.success) {
  console.log('File uploaded:', result.cid);
  console.log('Verified:', result.verified);
}
```

### Dataset Upload

```typescript
import { uploadDatasetToIPFS } from './utils/ipfsUpload';

const dataset = {
  name: 'User Data',
  records: [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' }
  ]
};

const result = await uploadDatasetToIPFS(dataset, {
  metadata: {
    name: 'User Dataset',
    description: 'Sample user data'
  },
  keyvalues: {
    type: 'dataset',
    format: 'json'
  }
});
```

### File Verification

```typescript
import { verifyFileIntegrity, isValidCID } from './utils/ipfsVerification';

// Validate CID format
const isValid = isValidCID('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG');

// Verify file integrity
const verification = await verifyFileIntegrity('your-cid-here');
if (verification.isValid) {
  console.log('File is valid and accessible');
}
```

### Groups Management

```typescript
import { createGroup, addFileToGroup, listGroups } from './utils/pinataGroups';

// Create a group
const group = await createGroup({
  name: 'My Dataset Group',
  isPublic: false
});

// Upload file to group
const result = await uploadToIPFS(file, {
  groupId: group.id,
  metadata: { name: 'Group File' }
});

// List all groups
const groups = await listGroups();
```

### Smart Upload with Fallback

```typescript
import { smartUploadToIPFS } from './utils/ipfsUpload';

const result = await smartUploadToIPFS(file, {
  metadata: {
    name: 'Smart Upload Test',
    description: 'Uses fallback if needed'
  }
});

// Automatically handles errors and provides simulation fallback
```

## 🧪 Testing

### Run Quick Test

```typescript
import { runQuickTest } from './utils/ipfsTest';

// Run basic functionality test
await runQuickTest();
```

### Run Full Test Suite

```typescript
import { IPFSTestSuite } from './utils/ipfsTest';

// Run comprehensive tests
const testSuite = new IPFSTestSuite();
await testSuite.runAllTests();
```

### Test Coverage

The test suite covers:
- Configuration validation
- File upload functionality
- Dataset upload
- CID validation and verification
- Groups management
- Metadata and keyvalues
- Error handling and edge cases

## 🔒 Security Features

### Rate Limiting
- Configurable API call limits
- Automatic backoff and retry logic
- User-friendly error messages

### Input Validation
- Filename sanitization
- File size validation
- CID format validation
- Metadata validation

### Secure Configuration
- Environment variable validation
- JWT token security checks
- API key management

### Error Handling
- Comprehensive error catching
- Graceful degradation
- Detailed error reporting

## 🚨 Error Handling

### Common Error Types

1. **Configuration Errors**
   ```typescript
   // Missing JWT token
   Error: 'Pinata JWT token not configured'
   
   // Invalid JWT format
   Error: 'Invalid JWT token format'
   ```

2. **Rate Limiting**
   ```typescript
   // Too many requests
   Error: 'Rate limit exceeded. Please wait X seconds'
   ```

3. **File Validation**
   ```typescript
   // File too large
   Error: 'File size exceeds maximum limit'
   
   // Invalid filename
   Error: 'Invalid filename format'
   ```

4. **Upload Errors**
   ```typescript
   // Network issues
   Error: 'Upload failed: Network error'
   
   // Pinata API errors
   Error: 'Pinata API error: [specific error]'
   ```

### Error Recovery

The system includes automatic error recovery:
- Retry logic for transient failures
- Fallback to simulation mode in development
- Graceful degradation for non-critical features

## 📊 Monitoring and Debugging

### Logging

All functions include comprehensive logging:
- Success/failure status
- Performance metrics
- Error details
- Debug information

### Debug Mode

Enable detailed logging by setting:
```typescript
// In development
console.log('IPFS Debug mode enabled');
```

## 🔄 Migration Guide

### From Previous Implementation

If upgrading from a previous IPFS implementation:

1. **Update imports**:
   ```typescript
   // Old
   import { uploadToIPFS } from './api/upload';
   
   // New
   import { uploadToIPFS } from './utils/ipfsUpload';
   ```

2. **Update function signatures**:
   ```typescript
   // Old
   uploadToIPFS(file, filename)
   
   // New
   uploadToIPFS(file, {
     metadata: { name: filename },
     verifyAfterUpload: true
   })
   ```

3. **Handle new return format**:
   ```typescript
   // New return format includes verification status
   const result = await uploadToIPFS(file, options);
   if (result.success && result.verified) {
     // File uploaded and verified
   }
   ```

## 🎯 Best Practices

### File Organization
- Use meaningful metadata names and descriptions
- Implement consistent keyvalue schemas
- Organize related files using Groups

### Performance
- Enable verification only when necessary
- Use appropriate file size limits
- Implement proper error handling

### Security
- Never commit JWT tokens to version control
- Use environment variables for all secrets
- Implement proper input validation

### Testing
- Run tests before deployment
- Test with various file types and sizes
- Verify error handling scenarios

## 🔗 Resources

- [Pinata Documentation](https://docs.pinata.cloud/)
- [IPFS Documentation](https://docs.ipfs.io/)
- [Pinata SDK GitHub](https://github.com/PinataCloud/pinata-web3)

## 🐛 Troubleshooting

### Common Issues

1. **"Pinata JWT token not configured"**
   - Check `.env` file exists and contains `VITE_PINATA_JWT`
   - Verify JWT token is valid and not expired

2. **"Rate limit exceeded"**
   - Wait for the specified time before retrying
   - Consider adjusting rate limit settings

3. **"File size exceeds maximum limit"**
   - Check file size against `VITE_MAX_FILE_SIZE`
   - Compress files if necessary

4. **"Invalid CID format"**
   - Verify CID string format
   - Check for extra whitespace or characters

### Getting Help

If you encounter issues:
1. Check the console for detailed error messages
2. Run the test suite to identify specific problems
3. Verify environment configuration
4. Check Pinata service status

## 📈 Future Enhancements

Potential improvements:
- Batch upload functionality
- Advanced metadata querying
- File deduplication
- Enhanced caching strategies
- Real-time upload progress tracking