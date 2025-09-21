import http from 'node:http';
import { invalidHeaderCounter } from '../core/observability/metrics.js';

const UPSTREAM_HEADERS_ALLOWLIST = [
  'user-agent',
  'referer',
  'origin',
  'accept',
  'accept-language',
];

export function sanitizeHeaders(sessionId: string, requiredHeaders: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const key in requiredHeaders) {
    const lowerKey = key.toLowerCase();
    if (UPSTREAM_HEADERS_ALLOWLIST.includes(lowerKey)) {
      const value = requiredHeaders[key];
      try {
        // http.validateHeaderValue is strict in Node 22+
        http.validateHeaderValue(key, value);
        sanitized[key] = value;
      } catch (err: any) {
        invalidHeaderCounter.inc({ sessionId, headerName: key });
      }
    }
  }
  return sanitized;
}
