import type { CompanySourceConfig } from './types';

export const companySources: CompanySourceConfig[] = [
  { companyId: 'airbnb', companyName: 'Airbnb', source: 'greenhouse', boardIdentifier: 'airbnb', enabled: true },
  { companyId: 'stripe', companyName: 'Stripe', source: 'greenhouse', boardIdentifier: 'stripe', enabled: true },
  { companyId: 'cloudflare', companyName: 'Cloudflare', source: 'greenhouse', boardIdentifier: 'cloudflare', enabled: true },
  { companyId: 'datadog', companyName: 'Datadog', source: 'greenhouse', boardIdentifier: 'datadog', enabled: true },
  { companyId: 'gitlab', companyName: 'GitLab', source: 'greenhouse', boardIdentifier: 'gitlab', enabled: true },
  { companyId: 'coinbase', companyName: 'Coinbase', source: 'greenhouse', boardIdentifier: 'coinbase', enabled: true },
  { companyId: 'palantir', companyName: 'Palantir', source: 'lever', boardIdentifier: 'palantir', enabled: true },
  { companyId: 'openai', companyName: 'OpenAI', source: 'ashby', boardIdentifier: 'openai', enabled: true },
  { companyId: 'notion', companyName: 'Notion', source: 'ashby', boardIdentifier: 'notion', enabled: true },
  { companyId: 'linear', companyName: 'Linear', source: 'ashby', boardIdentifier: 'linear', enabled: true },
  { companyId: 'ramp', companyName: 'Ramp', source: 'ashby', boardIdentifier: 'ramp', enabled: true },
];
