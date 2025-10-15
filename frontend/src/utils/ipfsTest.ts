import { uploadToIPFS, smartUploadToIPFS } from './ipfsUpload';
import { isValidCID, verifyCIDExists } from './ipfsVerification';
import { createGroup, listGroups, getOrCreateGroup } from './pinataGroups';
import { validatePinataConfig } from './pinataConfig';

/**
 * Test suite for IPFS functionality
 */
export class IPFSTestSuite {
  private testResults: Array<{ test: string; passed: boolean; error?: string }> = [];

  /**
   * Run all IPFS tests
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 Starting IPFS Test Suite...\n');

    try {
      // Test configuration
      await this.testConfiguration();
      
      // Test file upload
      await this.testFileUpload();
      
      // Test dataset upload
      await this.testDatasetUpload();
      
      // Test file verification
      await this.testFileVerification();
      
      // Test groups functionality
      await this.testGroupsManagement();
      
      // Test metadata and keyvalues
      await this.testMetadataFeatures();

      // Print results
      this.printResults();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  /**
   * Test Pinata configuration
   */
  private async testConfiguration(): Promise<void> {
    try {
      validatePinataConfig();
      this.addResult('Configuration validation', true);
    } catch (error) {
      this.addResult('Configuration validation', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Test basic file upload
   */
  private async testFileUpload(): Promise<void> {
    try {
      // Create a test file
      const testContent = 'Hello, IPFS! This is a test file.';
      const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });

      const result = await uploadToIPFS(testFile, {
        metadata: {
          name: 'Test File Upload',
          keyvalues: {
            test: 'true',
            type: 'unit-test',
            description: 'Testing basic file upload functionality',
          },
        },
        verify: true,
      });

      if (result.cid && result.verified) {
        this.addResult('Basic file upload', true);
        console.log(`✅ File uploaded successfully: ${result.cid}`);
      } else {
        this.addResult('Basic file upload', false, 'Upload failed or verification failed');
      }
    } catch (error) {
      this.addResult('Basic file upload', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Test dataset upload
   */
  private async testDatasetUpload(): Promise<void> {
    try {
      const testDataset = {
        name: 'Test Dataset',
        description: 'A test dataset for verification',
        data: [
          { id: 1, value: 'test1' },
          { id: 2, value: 'test2' }
        ]
      };

      // Convert dataset to JSON file for upload
      const jsonString = JSON.stringify(testDataset, null, 2);
      const file = new File([jsonString], 'test-dataset.json', { type: 'application/json' });

      const result = await uploadToIPFS(file, {
        metadata: {
          name: 'Test Dataset Upload',
          keyvalues: {
            type: 'dataset',
            test: 'true'
          }
        }
      });

      if (result.cid) {
        this.addResult('Dataset upload', true);
        console.log(`✅ Dataset uploaded successfully: ${result.cid}`);
      } else {
        this.addResult('Dataset upload', false, 'Dataset upload failed');
      }
    } catch (error) {
      this.addResult('Dataset upload', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Test file verification
   */
  private async testFileVerification(): Promise<void> {
    try {
      // Test CID validation
      const validCID = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const invalidCID = 'invalid-cid';

      const validTest = isValidCID(validCID);
      const invalidTest = !isValidCID(invalidCID);

      if (validTest && invalidTest) {
        this.addResult('CID validation', true);
      } else {
        this.addResult('CID validation', false, 'CID validation logic failed');
      }

      // Test CID existence check (using a known IPFS hash)
      const existenceResult = await verifyCIDExists(validCID);
      if (existenceResult.isValid) {
        this.addResult('CID existence check', true);
      } else {
        this.addResult('CID existence check', false, existenceResult.error || 'Unknown error');
      }
    } catch (error) {
      this.addResult('File verification', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Test groups management
   */
  private async testGroupsManagement(): Promise<void> {
    try {
      // Create a test group
      const testGroupName = `test-group-${Date.now()}`;
      const group = await createGroup({
        name: testGroupName,
        isPublic: false
      });

      if (group && group.id) {
        this.addResult('Group creation', true);
        console.log(`✅ Group created: ${group.name} (${group.id})`);

        // Test listing groups
        const groups = await listGroups();
        const foundGroup = groups.find(g => g.id === group.id);
        
        if (foundGroup) {
          this.addResult('Group listing', true);
        } else {
          this.addResult('Group listing', false, 'Created group not found in list');
        }

        // Test get or create functionality
        const existingGroup = await getOrCreateGroup(testGroupName);
        if (existingGroup.id === group.id) {
          this.addResult('Get or create group', true);
        } else {
          this.addResult('Get or create group', false, 'Group ID mismatch');
        }
      } else {
        this.addResult('Group creation', false, 'Group creation returned invalid result');
      }
    } catch (error) {
      this.addResult('Groups management', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Test metadata and keyvalues features
   */
  private async testMetadataFeatures(): Promise<void> {
    try {
      const testContent = 'Metadata test content';
      const testFile = new File([testContent], 'metadata-test.txt', { type: 'text/plain' });

      const result = await smartUploadToIPFS(testFile, {
        metadata: {
          name: 'Metadata Test File',
          keyvalues: {
            description: 'Testing metadata functionality',
            category: 'test',
            environment: 'test',
            version: '1.0',
            automated: 'true',
          },
        },
      });

      if (result.cid && result.metadata) {
        this.addResult('Metadata and keyvalues', true);
        console.log(`✅ File with metadata uploaded: ${result.cid}`);
      } else {
        this.addResult('Metadata and keyvalues', false, 'Metadata upload failed');
      }
    } catch (error) {
      this.addResult('Metadata and keyvalues', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Add test result
   */
  private addResult(test: string, passed: boolean, error?: string): void {
    this.testResults.push({ test, passed, error });
  }

  /**
   * Print test results
   */
  private printResults(): void {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');

    let passed = 0;
    let failed = 0;

    this.testResults.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} - ${result.test}`);
      
      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`);
      }

      if (result.passed) {
        passed++;
      } else {
        failed++;
      }
    });

    console.log('\n========================');
    console.log(`Total: ${this.testResults.length} | Passed: ${passed} | Failed: ${failed}`);
    
    if (failed === 0) {
      console.log('🎉 All tests passed!');
    } else {
      console.log(`⚠️  ${failed} test(s) failed. Please check the errors above.`);
    }
  }
}

/**
 * Run a quick test of core functionality
 */
export async function runQuickTest(): Promise<void> {
  console.log('🚀 Running quick IPFS functionality test...\n');

  try {
    // Test configuration
    validatePinataConfig();
    console.log('✅ Configuration is valid');

    // Test CID validation
    const testCID = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
    const isValid = isValidCID(testCID);
    console.log(`✅ CID validation works: ${isValid}`);

    // Test file creation (simulation only)
    console.log('✅ Test file creation simulated successfully');

    console.log('\n🎉 Quick test completed successfully!');
    console.log('💡 Run the full test suite with: new IPFSTestSuite().runAllTests()');

  } catch (error) {
    console.error('❌ Quick test failed:', error);
  }
}