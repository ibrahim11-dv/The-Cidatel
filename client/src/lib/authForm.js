function valueOf(fields, name) {
  return String(fields[name] ?? '')
}

export function readAuthForm(entries, registering) {
  const fields = Object.fromEntries(entries)
  if (registering) {
    return {
      username: valueOf(fields, 'username').trim(),
      email: valueOf(fields, 'email').trim(),
      password: valueOf(fields, 'password'),
      confirmPassword: valueOf(fields, 'confirmPassword'),
    }
  }
  return {
    identifier: valueOf(fields, 'identifier').trim(),
    password: valueOf(fields, 'password'),
  }
}
