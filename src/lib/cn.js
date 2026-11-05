/**
 * cn — junta classes condicionalmente (sem dependência externa).
 * Aceita strings, arrays e valores falsy (ignorados).
 */
export function cn(...args) {
  return args
    .flat(Infinity)
    .filter(Boolean)
    .join(' ')
    .trim()
}
