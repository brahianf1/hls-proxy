import { ProxySession } from './model.js';
import { logger } from '../observability/logger.js';

const sessionStore = new Map<string, ProxySession>();

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [sessionId, session] of sessionStore.entries()) {
    if (session.expiresAt < now) {
      sessionStore.delete(sessionId);
      logger.info(`Session expired and removed: ${sessionId}`);
    }
  }
}

setInterval(cleanupExpiredSessions, 60 * 1000); // Run cleanup every minute

export const sessionManager = {
  get: (sessionId: string): ProxySession | undefined => {
    return sessionStore.get(sessionId);
  },
  set: (session: ProxySession) => {
    sessionStore.set(session.sessionId, session);
    logger.info(`New session created: ${session.sessionId}`);
  },
  delete: (sessionId: string) => {
    sessionStore.delete(sessionId);
    logger.info(`Session deleted: ${sessionId}`);
  },
  values: () => {
    return sessionStore.values();
  }
};
