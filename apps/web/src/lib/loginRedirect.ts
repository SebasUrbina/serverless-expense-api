/** Where to go after signing in: an internal path, never another site or the login itself. */
export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  if (value.startsWith('/\\') || value.startsWith('/login')) return '/';
  return value;
}

/** Login address that comes back to `path` (with its query) after signing in. */
export const loginHref = (path: string) =>
  safeNext(path) === '/'
    ? '/login'
    : `/login?next=${encodeURIComponent(safeNext(path))}`;

/** The `next` of the current login address. */
export const nextFromLocation = () =>
  safeNext(new URLSearchParams(window.location.search).get('next'));
