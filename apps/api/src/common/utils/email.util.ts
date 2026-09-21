/**
 * Email addresses are identifiers here, so they must compare the way users
 * expect them to. Sign-in lookups were exact-match, which meant an account
 * stored as "Dilanka@gmail.com" could never be reached by someone typing
 * "dilanka@gmail.com", and a stray trailing space from a paste locked the
 * account out permanently. Normalising on every write, and comparing
 * case-insensitively on every read, keeps one address meaning one account.
 */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
