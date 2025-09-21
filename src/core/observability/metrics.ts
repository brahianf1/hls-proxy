import { Registry, Counter } from 'prom-client';

export const registry = new Registry();

export const resolverErrorCounter = new Counter({
  name: 'hls_proxy_resolver_errors_total',
  help: 'Total number of errors from the resolver service',
  labelNames: ['sourceId', 'reason'],
  registers: [registry],
});

export const upstreamErrorCounter = new Counter({
  name: 'hls_proxy_upstream_errors_total',
  help: 'Total number of upstream errors',
  labelNames: ['sessionId', 'statusCode'],
  registers: [registry],
});

export const invalidHeaderCounter = new Counter({
  name: 'hls_proxy_invalid_headers_total',
  help: 'Total number of invalid upstream headers discarded',
  labelNames: ['sessionId', 'headerName'],
  registers: [registry],
});

export const manifestRewriteCounter = new Counter({
  name: 'hls_proxy_manifest_rewrites_total',
  help: 'Total number of rewritten manifests',
  labelNames: ['sessionId', 'type'],
  registers: [registry],
});

export const segmentProxyCounter = new Counter({
  name: 'hls_proxy_segment_proxied_total',
  help: 'Total number of proxied segments',
  labelNames: ['sessionId', 'type'],
  registers: [registry],
});
