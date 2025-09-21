export interface ProxySession {
  sessionId: string;
  originBase: string;
  upstreamHeaders: Record<string, string>;
  cookieHeader?: string;
  masterUrl: string;
  expiresAt: number;
}
