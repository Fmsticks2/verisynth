import { ethers } from 'ethers';
import { GeneratedDataset } from '../types';

// Seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    this.seed = this.hashCode(seed);
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}

// Sample data templates
const SAMPLE_NAMES = [
  'Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Eva Brown',
  'Frank Miller', 'Grace Lee', 'Henry Taylor', 'Ivy Chen', 'Jack Anderson'
];

const SAMPLE_CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
  'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'
];

const SAMPLE_PRODUCTS = [
  'Laptop', 'Smartphone', 'Tablet', 'Headphones', 'Camera',
  'Watch', 'Speaker', 'Monitor', 'Keyboard', 'Mouse'
];

const SAMPLE_CATEGORIES = [
  'Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports',
  'Automotive', 'Health', 'Beauty', 'Toys', 'Food'
];

export function generateSyntheticData(
  modelVersion: string,
  seed: string,
  topic: string,
  recordCount: number = 100
): GeneratedDataset {
  const rng = new SeededRandom(seed);
  const data: any[] = [];

  // Generate data based on topic
  for (let i = 0; i < recordCount; i++) {
    let record: any = {};

    switch (topic.toLowerCase()) {
      case 'users':
      case 'customers':
        record = {
          id: i + 1,
          name: rng.choice(SAMPLE_NAMES),
          email: `user${i + 1}@example.com`,
          age: rng.nextInt(18, 80),
          city: rng.choice(SAMPLE_CITIES),
          registrationDate: new Date(
            Date.now() - rng.nextInt(0, 365 * 24 * 60 * 60 * 1000)
          ).toISOString().split('T')[0],
          isActive: rng.next() > 0.3
        };
        break;

      case 'products':
      case 'inventory':
        record = {
          id: i + 1,
          name: rng.choice(SAMPLE_PRODUCTS),
          category: rng.choice(SAMPLE_CATEGORIES),
          price: parseFloat(rng.nextFloat(10, 1000).toFixed(2)),
          stock: rng.nextInt(0, 500),
          rating: parseFloat(rng.nextFloat(1, 5).toFixed(1)),
          inStock: rng.next() > 0.2
        };
        break;

      case 'sales':
      case 'transactions':
        record = {
          id: i + 1,
          customerId: rng.nextInt(1, 1000),
          productId: rng.nextInt(1, 100),
          quantity: rng.nextInt(1, 10),
          amount: parseFloat(rng.nextFloat(5, 500).toFixed(2)),
          date: new Date(
            Date.now() - rng.nextInt(0, 90 * 24 * 60 * 60 * 1000)
          ).toISOString().split('T')[0],
          status: rng.choice(['completed', 'pending', 'cancelled'])
        };
        break;

      case 'financial':
      case 'finance':
        record = {
          id: i + 1,
          accountId: `ACC${String(i + 1).padStart(6, '0')}`,
          balance: parseFloat(rng.nextFloat(100, 50000).toFixed(2)),
          transactionType: rng.choice(['credit', 'debit']),
          amount: parseFloat(rng.nextFloat(10, 5000).toFixed(2)),
          timestamp: new Date(
            Date.now() - rng.nextInt(0, 30 * 24 * 60 * 60 * 1000)
          ).toISOString(),
          description: rng.choice(['Payment', 'Transfer', 'Deposit', 'Withdrawal'])
        };
        break;

      default:
        // Generic data structure
        record = {
          id: i + 1,
          value: parseFloat(rng.nextFloat(0, 1000).toFixed(2)),
          category: rng.choice(['A', 'B', 'C', 'D']),
          timestamp: new Date(
            Date.now() - rng.nextInt(0, 365 * 24 * 60 * 60 * 1000)
          ).toISOString(),
          active: rng.next() > 0.5
        };
    }

    data.push(record);
  }

  const metadata = {
    modelVersion,
    seed,
    topic,
    generatedAt: Date.now()
  };

  // Create hash of the data
  const dataString = JSON.stringify({ data, metadata });
  const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataString));

  return {
    data,
    hash,
    metadata
  };
}

export function computeDataHash(data: any): string {
  const dataString = JSON.stringify(data);
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataString));
}

export function mockIPFSUpload(data: any): Promise<string> {
  // Mock IPFS upload - in a real implementation, this would upload to IPFS
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockCID = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      resolve(mockCID);
    }, 1000);
  });
}