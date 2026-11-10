import { appResource } from '@/shared/api/appResource'
import type { Workspace } from '@/shared/config/workspaces'
import type { Lang, LocalizedText } from '@/shared/i18n/dictionaries'
import type { Banner, BannerState, BannerTargetKind } from './banners'
import type { AppId, Slide } from './slides'

type ApiImage = { uz: string; ru: string }

const imageOf = (raw: ApiImage): Partial<Record<Lang, string>> | undefined =>
  raw.uz || raw.ru ? { uz: raw.uz || undefined, ru: raw.ru || undefined } : undefined

const imageBody = (image: Partial<Record<Lang, string>> | undefined): ApiImage => ({
  uz: image?.uz ?? '',
  ru: image?.ru ?? '',
})

type ApiSlide = {
  id: string
  app: AppId
  image: ApiImage
  built_in: boolean
  title: LocalizedText
  visible: boolean
}
type SlideInput = Pick<Slide, 'image' | 'title' | 'visible'>

export const slidesApi = appResource<Slide, ApiSlide, SlideInput>('slides', {
  fromApi: (raw) => ({
    id: raw.id,
    app: raw.app,
    image: imageOf(raw.image),
    builtIn: raw.built_in || undefined,
    title: raw.title,
    visible: raw.visible,
  }),
  toApi: (input) => ({
    image: imageBody(input.image),
    title: input.title,
    visible: input.visible,
  }),
})

/** The panel writes "16.10.2026"; the API wants "2026-10-16". Empty stays empty. */
const toIsoDay = (day: string) => {
  const [d, m, y] = day.split('.')
  return y ? `${y}-${m}-${d}` : ''
}
const fromIsoDay = (day: string) => {
  const [y, m, d] = day.split('-')
  return y ? `${d}.${m}.${y}` : ''
}

type ApiBanner = {
  id: string
  app: AppId
  title: LocalizedText
  image: ApiImage
  built_in: boolean
  target: BannerTargetKind
  ids: string[]
  visible: boolean
  starts_on: string
  ends_on: string
  state: BannerState
}
type BannerInput = Pick<
  Banner,
  'title' | 'image' | 'target' | 'ids' | 'visible' | 'startsOn' | 'endsOn'
>

export const bannersApi = appResource<Banner, ApiBanner, BannerInput>('banners', {
  fromApi: (raw) => ({
    id: raw.id,
    app: raw.app,
    title: raw.title,
    image: imageOf(raw.image),
    builtIn: raw.built_in || undefined,
    target: raw.target,
    ids: raw.ids ?? [],
    visible: raw.visible,
    startsOn: fromIsoDay(raw.starts_on),
    endsOn: fromIsoDay(raw.ends_on),
    state: raw.state,
  }),
  toApi: (input) => ({
    title: input.title,
    image: imageBody(input.image),
    target: input.target,
    ids: input.target === 'nearest' ? [] : input.ids,
    visible: input.visible,
    starts_on: toIsoDay(input.startsOn),
    ends_on: toIsoDay(input.endsOn),
  }),
})

export type OnboardingApp = Extract<Workspace, AppId>
