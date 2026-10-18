import fortunaMark from '@/shared/assets/brands/fortuna-mark.svg'
import vodiyMark from '@/shared/assets/brands/vodiy-mark.png'
import logoMark from '@/shared/assets/logo-mark.svg'

/**
 * The panel runs three businesses: Birzum (nasiya) and two microloan brands. The URL says which
 * one is open: microloan pages sit under /fortuna/... and /vodiy/..., the rest is Birzum, as in
 * the apps. Each has its own sidebar.
 */
export const WORKSPACES = ['birzum', 'fortuna', 'vodiy'] as const
export type Workspace = (typeof WORKSPACES)[number]
export type Brand = Exclude<Workspace, 'birzum'>
export const BRANDS: Brand[] = ['fortuna', 'vodiy']

export const WORKSPACE_INFO: Record<Workspace, { name: string; mark: string; home: string }> = {
  birzum: { name: 'Birzum', mark: logoMark, home: '/' },
  fortuna: { name: 'Fortuna Biznes', mark: fortunaMark, home: '/fortuna' },
  vodiy: { name: 'Vodiy Taraqqiyot', mark: vodiyMark, home: '/vodiy' },
}

/** Which business a path belongs to. */
export function workspaceOf(pathname: string): Workspace {
  const first = pathname.split('/')[1]
  return (BRANDS as string[]).includes(first) ? (first as Brand) : 'birzum'
}

/** A microloan page's path within a brand, e.g. brandPath('vodiy', 'products'). */
export const brandPath = (brand: Brand, page = '') => (page ? `/${brand}/${page}` : `/${brand}`)
