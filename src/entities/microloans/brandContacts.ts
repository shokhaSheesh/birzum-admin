import type { Brand } from '@/shared/config/workspaces'
import type { LocalizedText } from '@/shared/i18n/dictionaries'

/** Uzbekistan's regions, in the order a branch list is grouped by. */
export const REGIONS = [
  'tashkentCity',
  'tashkent',
  'andijan',
  'fergana',
  'namangan',
  'samarkand',
  'bukhara',
  'jizzakh',
  'kashkadarya',
  'navoi',
  'surkhandarya',
  'syrdarya',
  'khorezm',
  'karakalpakstan',
] as const
export type Region = (typeof REGIONS)[number]

/**
 * How a brand's app users reach it, shown in the app's Kontaktlar: the phones (the first is the
 * main line), email, socials, website, head office and hours.
 */
export type BrandContacts = {
  id: Brand
  /** Nine digits after +998 each. */
  phones: string[]
  email: string
  website: string
  telegram?: string
  instagram?: string
  address: LocalizedText
  hours: LocalizedText
}

/** One branch, under its region in the app; borrowers pay cash and get help there. */
export type Branch = {
  id: string
  brand: Brand
  region: Region
  address: string
  phone?: string
  /** The pin on the map (WGS84), if one was set. */
  location?: { lat: number; lng: number }
  /** Working days only; a day that is not listed is a day off. Times are Tashkent's, "09:00". */
  schedule: { weekday: number; open: string; close: string }[]
}
