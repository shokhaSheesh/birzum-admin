// Stand-in for "forgot password": the backend has no endpoint for it yet (admin doc, section 7).
// Any email works, and any 6-character code except "000000".

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Pretends to send the reset code to the admin's email. */
export async function requestReset(_email: string) {
  await delay(800)
}

export async function verifyResetCode(_email: string, code: string) {
  await delay(600)
  if (code === '000000') throw new Error('invalid_code')
}

/** Sets the new password; the admin then signs in with it. */
export async function resetPassword(_email: string, _password: string) {
  await delay(700)
}
