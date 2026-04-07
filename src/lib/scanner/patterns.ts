import type { PatternRule } from '@/types/scanner';

export const PATTERNS: PatternRule[] = [
  {
    name: 'GitHub Token',
    regex: /ghp_[A-Za-z0-9_]{36,}/g,
    severity: 'critical',
  },
  {
    name: 'Stripe Secret Key',
    regex: /sk_(live|test)_[A-Za-z0-9]{20,}/g,
    severity: 'critical',
  },
  {
    name: 'AWS Access Key',
    regex: /AKIA[0-9A-Z]{16}/g,
    severity: 'critical',
  },
  {
    name: 'Generic API Key',
    regex: /(?:api[_-]?key|apikey)\s*[:=]\s*["']?([A-Za-z0-9_\-]{20,})/gi,
    severity: 'high',
  },
  {
    name: 'Private Key Block',
    regex: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/g,
    severity: 'critical',
  },
  {
    name: 'Password Assignment',
    regex: /(?:password|passwd|pwd)\s*[:=]\s*["']([^\s"']{8,})/gi,
    severity: 'high',
  },
  {
    name: 'Connection String',
    regex: /(?:mongodb|postgres|mysql|redis):\/\/[^\s"'`]+/gi,
    severity: 'high',
  },
];
