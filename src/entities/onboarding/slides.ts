import type { Lang, LocalizedText } from '@/shared/i18n/dictionaries'

/** The apps whose intro slides this panel manages. */
export const APPS = ['birzum', 'fortuna', 'vodiy'] as const
export type AppId = (typeof APPS)[number]

/**
 * One intro slide an app shows once, after the first sign-in. `image` is what the admin
 * uploaded, one per language (a picture may carry text); without it the app shows its own drawn picture (`builtIn`), which only the slides
 * that ship with the app have. New slides need an image.
 */
export type Slide = {
  id: string
  app: AppId
  image?: Partial<Record<Lang, string>>
  builtIn?: boolean
  title: LocalizedText
  visible: boolean
}
