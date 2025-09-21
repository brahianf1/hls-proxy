import { ResolverResponseDto } from '../types/dto.js';

export function buildCookieHeader(requiredCookies: ResolverResponseDto['requiredCookies']): string | undefined {
  if (!requiredCookies || requiredCookies.length === 0) {
    return undefined;
  }

  const now = Date.now() / 1000; // a segundos

  const validCookies = requiredCookies.filter((cookie: any) => {
    if (cookie.expires && cookie.expires < now) {
      return false; // descarta cookie expirada
    }
    return true;
  });

  if (validCookies.length === 0) {
    return undefined;
  }

  return validCookies.map((c: any) => `${c.name}=${c.value}`).join('; ');
}
