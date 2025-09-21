import { ProxySession } from '../sessions/model.js';

export async function fetchUpstream(url: string, session: ProxySession, requestHeaders: Record<string, string>): Promise<Response> {
  const headers = {
    ...session.upstreamHeaders,
    ...requestHeaders, // e.g. Range header
  };

  if (session.cookieHeader) {
    headers['Cookie'] = session.cookieHeader;
  }

  // Remove hop-by-hop headers that should not be proxied
  delete headers['host'];

  return fetch(url, { headers });
}
