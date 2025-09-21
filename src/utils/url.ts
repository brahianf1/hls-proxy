export function getOriginBase(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.origin;
  } catch (error) {
    return null;
  }
}

export function getAbsoluteUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http')) {
    return url;
  }
  const base = new URL(baseUrl);
  // If the URL starts with a '/', it's relative to the origin.
  if (url.startsWith('/')) {
    return `${base.origin}${url}`;
  }
  // Otherwise, it's relative to the current path.
  const path = base.pathname.substring(0, base.pathname.lastIndexOf('/'));
  return `${base.origin}${path}/${url}`;
}