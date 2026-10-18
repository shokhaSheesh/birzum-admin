// Stand-in for the real sign-in. Any username works; the password "wrong" is refused,
// so the error state can be seen.
import { logAction } from '@/entities/audit/audit'
import { session } from '@/entities/session/session'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function signIn(username: string, password: string) {
  await delay(800)
  if (password === 'wrong') throw new Error('invalid_credentials')
  session.signIn({ name: 'Sardor Saidov', username, initials: 'SS' })
  logAction({ section: 'admins', kind: 'access', action: 'audit.a.signedIn' })
}

/** Signs out, noting it in the log first while the admin is still known. */
export function signOut() {
  logAction({ section: 'admins', kind: 'access', action: 'audit.a.signedOut' })
  session.signOut()
}
