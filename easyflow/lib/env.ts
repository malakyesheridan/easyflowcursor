export function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  return url || 'http://localhost:3000';
}