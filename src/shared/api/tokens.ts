/**
 * The staff tokens. Kept in memory and mirrored to sessionStorage (not localStorage), so a page
 * refresh keeps the sign-in but closing the tab ends it.
 */
export type Tokens = {
  access: string
  accessExpiresAt: string
  refresh: string
  refreshExpiresAt: string
}

const KEY = 'birzum-admin.tokens'

function read(): Tokens | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Tokens) : null
  } catch {
    return null
  }
}

let current = read()

export const getTokens = () => current

export function setTokens(tokens: Tokens | null) {
  current = tokens
  try {
    if (tokens) sessionStorage.setItem(KEY, JSON.stringify(tokens))
    else sessionStorage.removeItem(KEY)
  } catch {
    // Storage blocked: the tokens live in memory until the page is closed
  }
}
