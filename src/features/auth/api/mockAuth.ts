// Stand-in for the real sign-in. Any username works; the password "wrong" is refused,
// so the error state can be seen. Forgot password: the email must belong to an admin, and
// any 6-character code works except "000000".
import { logAction } from '@/entities/audit/audit'
import { adminsStore } from '@/entities/admins/admins'
import { session } from '@/entities/session/session'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function signIn(username: string, password: string) {
  await delay(800)
  if (password === 'wrong') throw new Error('invalid_credentials')
  session.signIn({ name: 'Sardor Saidov', username, initials: 'SS' })
  logAction({ section: 'admins', kind: 'access', action: 'audit.a.signedIn' })
}

const adminWithEmail = (email: string) =>
  adminsStore.getAll().find((admin) => admin.email === email.toLowerCase())

/** Sends the reset code to the admin's email. Rejects when no admin has that email. */
export async function requestReset(email: string) {
  await delay(800)
  if (!adminWithEmail(email)) throw new Error('not_found')
}

export async function verifyResetCode(_email: string, code: string) {
  await delay(600)
  if (code === '000000') throw new Error('invalid_code')
}

/** Sets the new password; the admin then signs in with it. */
export async function resetPassword(email: string, _password: string) {
  await delay(700)
  logAction({
    section: 'admins',
    kind: 'access',
    action: 'audit.a.passwordReset',
    target: adminWithEmail(email)?.name,
  })
}

/** Signs out, noting it in the log first while the admin is still known. */
export function signOut() {
  logAction({ section: 'admins', kind: 'access', action: 'audit.a.signedOut' })
  session.signOut()
}
