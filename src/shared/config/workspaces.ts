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

export const WORKSPACE_INFO: Record<
  Workspace,
  { name: string; mark: string; home: string; /** Tax number on fiscal cheques. */ tin: string }
> = {
  // The STIRs are placeholders until each company gives its own, as in the apps
  birzum: { name: 'Birzum', mark: logoMark, home: '/', tin: '300000000' },
  fortuna: { name: 'Fortuna Biznes', mark: fortunaMark, home: '/fortuna', tin: '305000000' },
  vodiy: { name: 'Vodiy Taraqqiyot', mark: vodiyMark, home: '/vodiy', tin: '306000000' },
}

/** Which business a path belongs to. */
export function workspaceOf(pathname: string): Workspace {
  const first = pathname.split('/')[1]
  return (BRANDS as string[]).includes(first) ? (first as Brand) : 'birzum'
}

/** A microloan page's path within a brand, e.g. brandPath('vodiy', 'products'). */
export const brandPath = (brand: Brand, page = '') => (page ? `/${brand}/${page}` : `/${brand}`)

/** A microloan ariza's page within its brand. */
export const loanAppPath = (brand: Brand, id: string) => brandPath(brand, `applications/${id}`)

/** A microloan's page within its brand. */
export const brandLoanPath = (brand: Brand, id: string) => brandPath(brand, `loans/${id}`)
