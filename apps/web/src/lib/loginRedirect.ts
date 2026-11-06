const ORIGIN = 'https://seva.invalid';

/** Where to go after signing in: an internal path, never another site or the login itself. */
export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  // Browsers drop tabs and newlines and read "\" as "/", so "/\t/evil.com" leaves the site.
  if (/[\u0000-\u001F\u007F\\]/.test(value)) return '/';
  let url: URL;
  try {
    url = new URL(value, ORIGIN);
  } catch {
    return '/';
  }
  if (url.origin !== ORIGIN) return '/';
  if (url.pathname === '/login' || url.pathname.startsWith('/login/'))
    return '/';
  return url.pathname + url.search + url.hash;
}

/** Login address that comes back to `path` (with its query) after signing in. */
export const loginHref = (path: string) =>
  safeNext(path) === '/'
    ? '/login'
    : `/login?next=${encodeURIComponent(safeNext(path))}`;

/** The `next` of the current login address. */
export const nextFromLocation = () =>
  safeNext(new URLSearchParams(window.location.search).get('next'));
