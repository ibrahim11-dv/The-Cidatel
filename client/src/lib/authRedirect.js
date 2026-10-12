export function signInDestination({ pathname, search = '', hash = '' }) {
  return `/login?next=${encodeURIComponent(pathname + search + hash)}`
}

export function safeReturnPath(value) {
  // Only app-relative paths are valid; reject protocol-relative URLs and backslashes.
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value)) return '/profile'
  return value
}
