import { api } from '@/shared/api/client'
import { session } from '@/entities/session/session'

export const signIn = session.signIn
export const signOut = () => void session.signOut()

/** The admin changes their own password; their session stays, their other sessions end. */
export async function changePassword(oldPassword: string, newPassword: string) {
  await api('POST', '/admin/auth/change-password', {
    body: { old_password: oldPassword, new_password: newPassword },
  })
  await session.refresh()
}
