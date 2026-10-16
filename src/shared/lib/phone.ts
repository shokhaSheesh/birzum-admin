export const PHONE_PREFIX = '+998'
export const PHONE_DIGITS = 9

/** "901234567" -> "90 123 45 67" (works on partial input too) */
export function formatPhoneDigits(digits: string) {
  return [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)]
    .filter(Boolean)
    .join(' ')
}

/** "901234567" -> "+998 90 123 45 67" */
export function formatPhone(digits: string) {
  return `${PHONE_PREFIX} ${formatPhoneDigits(digits)}`
}
