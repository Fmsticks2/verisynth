export type CanonicalTopic = 'users' | 'products' | 'sales' | 'financial' | 'unknown';

export function canonicalizeTopic(input: string): CanonicalTopic {
  const t = (input || '').toLowerCase();
  if (/(user|customer|profile)/.test(t)) return 'users';
  if (/(product|inventory|catalog)/.test(t)) return 'products';
  if (/(sale|order|transaction)/.test(t)) return 'sales';
  if (/(financial|ledger|bank|banking|payment)/.test(t)) return 'financial';
  return 'unknown';
}

function requiredFieldsFor(topic: CanonicalTopic): string[] {
  switch (topic) {
    case 'users':
      return ['id', 'name', 'email', 'age', 'city', 'isActive'];
    case 'products':
      return ['id', 'name', 'category', 'price', 'inStock', 'rating', 'description'];
    case 'sales':
      return ['id', 'productId', 'customerId', 'quantity', 'amount', 'date', 'region'];
    case 'financial':
      return ['id', 'accountId', 'transactionType', 'amount', 'currency', 'timestamp', 'description'];
    default:
      return [];
  }
}

export function assessTopicCompliance(inputTopic: string, data: any[]): {
  canonicalTopic: CanonicalTopic;
  requiredCoverage: number; // 0-100 percentage of rows covering required fields
  score: number; // composite score (currently equals coverage)
} {
  const canonical = canonicalizeTopic(inputTopic);
  const required = requiredFieldsFor(canonical);
  if (canonical === 'unknown' || !Array.isArray(data) || data.length === 0) {
    return { canonicalTopic: canonical, requiredCoverage: 0, score: 0 };
  }

  let covered = 0;
  for (const row of data) {
    if (!row || typeof row !== 'object') continue;
    const ok = required.every((f) => Object.prototype.hasOwnProperty.call(row, f) && row[f] !== undefined && row[f] !== null);
    if (ok) covered++;
  }

  const coverage = Math.round((covered / data.length) * 10000) / 100; // percentage with 2 decimals
  const score = coverage; // simple mapping; can be expanded later
  return { canonicalTopic: canonical, requiredCoverage: coverage, score };
}