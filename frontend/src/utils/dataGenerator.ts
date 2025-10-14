import { GeneratedDataset } from '../types';
import { uploadDatasetToIPFS, smartUploadToIPFS } from './ipfsUpload';

// Predefined data templates for different topics
const DATA_TEMPLATES = {
  users: () => ({
    id: Math.floor(Math.random() * 10000),
    name: generateRandomName(),
    email: generateRandomEmail(),
    age: Math.floor(Math.random() * 60) + 18,
    city: generateRandomCity(),
    joinDate: generateRandomDate(),
    isActive: Math.random() > 0.3,
  }),
  products: () => ({
    id: Math.floor(Math.random() * 10000),
    name: generateRandomProductName(),
    category: generateRandomCategory(),
    price: Math.round((Math.random() * 1000 + 10) * 100) / 100,
    inStock: Math.random() > 0.2,
    rating: Math.round((Math.random() * 4 + 1) * 10) / 10,
    description: generateRandomDescription(),
  }),
  sales: () => ({
    id: Math.floor(Math.random() * 10000),
    productId: Math.floor(Math.random() * 1000),
    customerId: Math.floor(Math.random() * 5000),
    quantity: Math.floor(Math.random() * 10) + 1,
    amount: Math.round((Math.random() * 500 + 5) * 100) / 100,
    date: generateRandomDate(),
    region: generateRandomRegion(),
  }),
  financial: () => ({
    id: Math.floor(Math.random() * 10000),
    accountId: Math.floor(Math.random() * 100000),
    transactionType: Math.random() > 0.5 ? 'credit' : 'debit',
    amount: Math.round((Math.random() * 10000 + 1) * 100) / 100,
    currency: generateRandomCurrency(),
    timestamp: generateRandomDate(),
    description: generateRandomTransactionDescription(),
  }),
};

// Helper functions for generating random data
function generateRandomName(): string {
  const firstNames = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

function generateRandomEmail(): string {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'company.com'];
  const name = generateRandomName().toLowerCase().replace(' ', '.');
  return `${name}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

function generateRandomCity(): string {
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
  return cities[Math.floor(Math.random() * cities.length)];
}

function generateRandomDate(): string {
  const start = new Date(2020, 0, 1);
  const end = new Date();
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function generateRandomProductName(): string {
  const adjectives = ['Premium', 'Deluxe', 'Standard', 'Professional', 'Advanced', 'Basic', 'Ultimate', 'Elite'];
  const products = ['Widget', 'Gadget', 'Tool', 'Device', 'Component', 'Module', 'System', 'Solution'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${products[Math.floor(Math.random() * products.length)]}`;
}

function generateRandomCategory(): string {
  const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys', 'Health', 'Beauty'];
  return categories[Math.floor(Math.random() * categories.length)];
}

function generateRandomDescription(): string {
  const descriptions = [
    'High-quality product with excellent features',
    'Durable and reliable for everyday use',
    'Innovative design with modern functionality',
    'Perfect for professional and personal use',
    'Eco-friendly and sustainable option',
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function generateRandomRegion(): string {
  const regions = ['North', 'South', 'East', 'West', 'Central', 'Northeast', 'Southeast', 'Northwest', 'Southwest'];
  return regions[Math.floor(Math.random() * regions.length)];
}

function generateRandomCurrency(): string {
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];
  return currencies[Math.floor(Math.random() * currencies.length)];
}

function generateRandomTransactionDescription(): string {
  const descriptions = [
    'Online purchase',
    'ATM withdrawal',
    'Direct deposit',
    'Wire transfer',
    'Payment processing',
    'Subscription fee',
    'Refund processed',
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

export function generateSyntheticData(
  modelVersion: string,
  seed: string,
  topic: string,
  recordCount: number
): GeneratedDataset {
  // Use seed for reproducible randomization
  let seedValue = 0;
  for (let i = 0; i < seed.length; i++) {
    seedValue += seed.charCodeAt(i);
  }
  
  const seededRandom = function() {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  };

  const originalRandom = Math.random;
  Math.random = seededRandom;

  try {
    // Determine the data template based on topic
    const topicKey = topic.toLowerCase();
    let template: () => any = DATA_TEMPLATES.users; // default

    if (topicKey.includes('product')) template = DATA_TEMPLATES.products;
    else if (topicKey.includes('sale')) template = DATA_TEMPLATES.sales;
    else if (topicKey.includes('financial') || topicKey.includes('transaction')) template = DATA_TEMPLATES.financial;
    else if (topicKey.includes('user') || topicKey.includes('customer')) template = DATA_TEMPLATES.users;

    // Generate the data
    const data = Array.from({ length: recordCount }, () => template());

    // Create hash of the data
    const dataString = JSON.stringify(data);
    const hash = generateHash(dataString + seed + modelVersion);

    return {
      data,
      hash,
      metadata: {
        modelVersion,
        seed,
        topic,
        recordCount,
        generatedAt: Date.now(),
      },
    };
  } finally {
    // Restore original Math.random
    Math.random = originalRandom;
  }
}

function generateHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export function computeDataHash(data: any): string {
  const dataString = JSON.stringify(data);
  return generateHash(dataString);
}

// Replace the mock IPFS upload with real implementation
export async function uploadToIPFS(data: any): Promise<string> {
  try {
    const result = await uploadDatasetToIPFS(data);
    return result.cid;
  } catch (error) {
    console.error('IPFS upload failed:', error);
    // Fallback to smart upload which includes simulation
    const result = await smartUploadToIPFS(data);
    return result.cid;
  }
}

// Keep the old function name for backward compatibility but use real upload
export function mockIPFSUpload(data: any): Promise<string> {
  return uploadToIPFS(data);
}