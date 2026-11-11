import { logMock } from './audit'
import { mockError, mockRoutes } from './index'
import { ago, asBody, invalid, newId, nowIso, notFound } from './util'

type Kind = 'suggest' | 'geocoder' | 'maps' | 'mapkit'

type Key = {
  id: string
  kind: Kind
  label: string
  /** The sample keys are obviously fake; a key typed in the sample panel stays in this tab only. */
  secret: string
  active: boolean
  exhausted_until: string
  exhausted_count: number
  last_exhausted_at: string
  created_at: string
}

const key = (kind: Kind, label: string, secret: string, extra: Partial<Key> = {}): Key => ({
  id: newId(),
  kind,
  label,
  secret,
  active: true,
  exhausted_until: '',
  exhausted_count: 0,
  last_exhausted_at: '',
  created_at: ago(30),
  ...extra,
})

const keys: Key[] = [
  key('suggest', 'Asosiy', '00000000-0000-4000-8000-00000000aaaa'),
  key('suggest', 'Zaxira', '00000000-0000-4000-8000-00000000bbbb', {
    exhausted_until: new Date(Date.now() + 5 * 3_600_000).toISOString(),
    exhausted_count: 2,
    last_exhausted_at: ago(0, 2),
  }),
  key('geocoder', 'Asosiy', '00000000-0000-4000-8000-00000000cccc'),
  key('mapkit', 'iOS va Android', '00000000-0000-4000-8000-00000000dddd'),
  key('mapkit', 'Eski kalit', '00000000-0000-4000-8000-00000000eeee', { active: false }),
]

const statusOf = (item: Omit<Key, 'secret'>) =>
  !item.active
    ? 'off'
    : item.exhausted_until && Date.parse(item.exhausted_until) > Date.now()
      ? 'exhausted'
      : 'available'

const view = ({ secret, ...item }: Key) => ({
  ...item,
  masked: `••••${secret.slice(-4)}`,
  status: statusOf(item),
})

const find = (id: string) => {
  const found = keys.find((k) => k.id === id)
  if (!found) throw notFound()
  return found
}

const logKey = (action: string, kind: 'create' | 'update' | 'delete', item: Key) =>
  logMock({
    section: 'integrations',
    kind,
    action,
    target: `${item.label} (${item.kind} ••••${item.secret.slice(-4)})`,
    entity: 'geo_key',
    entityId: item.id,
  })

mockRoutes(
  {
    method: 'GET',
    match: '/admin/settings/geo/keys',
    handle: ({ query }) => ({
      items: keys.filter((k) => !query.kind || k.kind === query.kind).map(view),
    }),
  },
  {
    method: 'POST',
    match: '/admin/settings/geo/keys',
    handle({ body }) {
      const input = asBody(body)
      const kind = input.kind as Kind
      const secret = String(input.key ?? '').trim()
      const label = String(input.label ?? '').trim()
      if (!['suggest', 'geocoder', 'maps', 'mapkit'].includes(kind))
        throw invalid({ kind: 'is invalid' })
      if (!/^[A-Za-z0-9_-]{8,128}$/.test(secret) || label.length > 100)
        throw invalid({ key: 'is invalid' })
      if (keys.some((k) => k.kind === kind && k.secret === secret)) {
        throw mockError(409, 'geo_key_taken', 'This key is already in the pool')
      }
      const created = key(kind, label, secret, { created_at: nowIso() })
      keys.push(created)
      logKey('geoKeyAdded', 'create', created)
      return view(created)
    },
  },
  {
    method: 'GET',
    match: '/admin/settings/geo/keys/:id/check',
    handle({ params }) {
      const item = find(params.id)
      if (item.kind === 'maps' || item.kind === 'mapkit') return { result: 'not_checkable' }
      return { result: statusOf(item) === 'exhausted' ? 'rate_limited' : 'ok' }
    },
  },
  {
    method: 'PUT',
    match: '/admin/settings/geo/keys/:id',
    handle({ params, body }) {
      const item = find(params.id)
      const input = asBody(body)
      if (typeof input.active !== 'boolean') throw invalid({ active: 'is required' })
      item.label = String(input.label ?? item.label).trim()
      item.active = input.active
      if (input.clear_exhausted) item.exhausted_until = ''
      logKey('geoKeySaved', 'update', item)
      return view(item)
    },
  },
  {
    method: 'DELETE',
    match: '/admin/settings/geo/keys/:id',
    handle({ params }) {
      const item = find(params.id)
      keys.splice(keys.indexOf(item), 1)
      logKey('geoKeyDeleted', 'delete', item)
      return {}
    },
  },
)

// Address search: a few Tashkent places stand in for Yandex
type Place = { title: string; subtitle: string; address: string; lat: number; lng: number }

const PLACES: Place[] = [
  {
    title: 'Amir Temur koʻchasi, 107',
    subtitle: 'Toshkent',
    address: 'Oʻzbekiston, Toshkent, Amir Temur koʻchasi, 107',
    lat: 41.311151,
    lng: 69.279737,
  },
  {
    title: 'Amir Temur koʻchasi, 1',
    subtitle: 'Toshkent',
    address: 'Oʻzbekiston, Toshkent, Amir Temur koʻchasi, 1',
    lat: 41.311081,
    lng: 69.240562,
  },
  {
    title: 'Navoiy koʻchasi, 28',
    subtitle: 'Toshkent',
    address: 'Oʻzbekiston, Toshkent, Navoiy koʻchasi, 28',
    lat: 41.3,
    lng: 69.26,
  },
  {
    title: 'Mustaqillik shoh koʻchasi, 59',
    subtitle: 'Toshkent',
    address: 'Oʻzbekiston, Toshkent, Mustaqillik shoh koʻchasi, 59',
    lat: 41.315,
    lng: 69.285,
  },
  {
    title: 'Chilonzor, 9-kvartal',
    subtitle: 'Toshkent',
    address: 'Oʻzbekiston, Toshkent, Chilonzor tumani, 9-kvartal',
    lat: 41.275,
    lng: 69.204,
  },
  {
    title: 'Yunusobod, 4-kvartal',
    subtitle: 'Toshkent',
    address: 'Oʻzbekiston, Toshkent, Yunusobod tumani, 4-kvartal',
    lat: 41.365,
    lng: 69.288,
  },
  {
    title: 'Buyuk Ipak Yoʻli koʻchasi, 70',
    subtitle: 'Toshkent',
    address: 'Oʻzbekiston, Toshkent, Buyuk Ipak Yoʻli koʻchasi, 70',
    lat: 41.33,
    lng: 69.34,
  },
  {
    title: 'Mediapark, Bobur koʻchasi, 12',
    subtitle: 'Toshkent',
    address: 'Oʻzbekiston, Toshkent, Bobur koʻchasi, 12',
    lat: 41.322,
    lng: 69.251,
  },
]

const uriOf = (index: number) => `ymapsbm1://geo?data=sample-${index}`

mockRoutes(
  {
    method: 'GET',
    match: '/admin/geo/suggest',
    handle({ query }) {
      const text = (query.text ?? '').trim().toLowerCase()
      if (!text || text.length > 200) throw invalid({ text: 'is required' })
      const limit = Math.min(10, Math.max(1, Number(query.limit) || 7))
      const found = PLACES.map((place, index) => ({ place, index }))
        .filter(
          ({ place }) =>
            place.title.toLowerCase().includes(text) || place.address.toLowerCase().includes(text),
        )
        .slice(0, limit)
      return {
        items: found.map(({ place, index }) => ({
          title: place.title,
          subtitle: place.subtitle,
          address: place.address,
          uri: uriOf(index),
          tags: ['house'],
        })),
      }
    },
  },
  {
    method: 'GET',
    match: '/admin/geo/resolve',
    handle({ query }) {
      const index = PLACES.findIndex((_, i) => uriOf(i) === query.uri)
      if (!(query.uri ?? '').startsWith('ymapsbm1://')) throw invalid({ uri: 'is invalid' })
      if (index < 0) throw notFound()
      const place = PLACES[index]
      return {
        location: { lat: place.lat, lng: place.lng },
        name: place.title,
        address: place.address,
      }
    },
  },
)
