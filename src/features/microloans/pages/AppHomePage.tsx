import {
  CalendarDays,
  CreditCard,
  FileClock,
  FileText,
  Headset,
  House,
  Layers,
  Plus,
  User,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { logAction } from '@/entities/audit/audit'
import {
  infoTilesStore,
  menuSlotsStore,
  type InfoTile,
  type MenuSlot,
} from '@/entities/microloans/appHome'
import type { Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { InfoTileModal, MenuSlotModal } from '../components/AppHomeModals'
import { DragList } from '../components/DragList'
import { TileThumb } from '../components/TileThumb'

const ICONS: Record<MenuSlot['key'], LucideIcon> = {
  credits: Layers,
  pay: Wallet,
  cards: CreditCard,
  support: Headset,
  schedule: CalendarDays,
  applications: FileClock,
  home: House,
  loans: FileText,
  apply: Plus,
  payments: CreditCard,
  profile: User,
}

function Block({
  title,
  hint,
  action,
  children,
}: {
  title: string
  hint: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col rounded-card border border-line bg-canvas">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-sm text-ink-muted">{hint}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

/**
 * Asosiy oyna of one microloan brand's app: the small tiles at the top (like stories), the quick
 * actions and the tab bar. The background is the app's own theme, not set here. Tiles, actions and tabs are dragged into
 * the app's order; a click opens one to change its label or hide it.
 */
export function AppHomePage({ brand }: { brand: Brand }) {
  const { t, tl } = useI18n()
  const allTiles = infoTilesStore.useAll()
  const allSlots = menuSlotsStore.useAll()
  const tiles = allTiles.filter((tile) => tile.brand === brand)
  const actions = allSlots.filter((slot) => slot.brand === brand && slot.place === 'action')
  const tabs = allSlots.filter((slot) => slot.brand === brand && slot.place === 'tab')
  const [slot, setSlot] = useState<MenuSlot | null>(null)
  const [tile, setTile] = useState<InfoTile | null | undefined>(undefined)

  // Puts one list's new order back into its store, everything else where it is
  const placeSlots = (ordered: MenuSlot[]) => {
    const queue = [...ordered]
    const ids = new Set(ordered.map((item) => item.id))
    menuSlotsStore.replaceAll(allSlots.map((item) => (ids.has(item.id) ? queue.shift()! : item)))
    logAction({ section: 'mlOnboarding', kind: 'update', action: 'audit.a.appMenuOrdered' })
  }
  const placeTiles = (ordered: InfoTile[]) => {
    const queue = [...ordered]
    infoTilesStore.replaceAll(
      allTiles.map((item) => (item.brand === brand ? queue.shift()! : item)),
    )
  }

  const slotRow = (item: MenuSlot) => {
    const Icon = ICONS[item.key]
    return (
      <>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-brand">
          <Icon size={20} />
        </span>
        <span className={cn('min-w-0 flex-1 font-semibold', !item.visible && 'text-ink-muted')}>
          {tl(item.label)}
        </span>
        {item.locked ? (
          <span className="text-sm text-ink-muted">{t('appHome.always')}</span>
        ) : (
          <StatusBadge tone={item.visible ? 'success' : 'neutral'}>
            {t(item.visible ? 'appHome.shown' : 'appHome.hidden')}
          </StatusBadge>
        )}
      </>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader title={t('nav.appHome')} />

      <Block
        title={t('appHome.tiles')}
        hint={t('appHome.tiles.hint')}
        action={
          <Button size="sm" onClick={() => setTile(null)}>
            <Plus size={18} />
            {t('appHome.tile.new')}
          </Button>
        }
      >
        {tiles.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink-muted">{t('appHome.tiles.empty')}</p>
        ) : (
          <DragList
            items={tiles}
            name={(item) => tl(item.title)}
            onReorder={placeTiles}
            onOpen={setTile}
            render={(item) => (
              <>
                <TileThumb
                  image={item.image}
                  title={tl(item.title)}
                  className={cn('size-14!', !item.visible && 'opacity-50')}
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className={cn('font-semibold', !item.visible && 'text-ink-muted')}>
                    {tl(item.title)}
                  </span>
                  <span className="truncate text-sm text-ink-muted">{tl(item.text)}</span>
                </div>
                <StatusBadge tone={item.visible ? 'success' : 'neutral'}>
                  {t(item.visible ? 'appHome.shown' : 'appHome.hidden')}
                </StatusBadge>
              </>
            )}
          />
        )}
      </Block>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Block title={t('appHome.actions')} hint={t('appHome.actions.hint')}>
          <DragList
            items={actions}
            name={(item) => tl(item.label)}
            onReorder={placeSlots}
            onOpen={setSlot}
            render={slotRow}
          />
        </Block>
        <Block title={t('appHome.tabs')} hint={t('appHome.tabs.hint')}>
          <DragList
            items={tabs}
            name={(item) => tl(item.label)}
            onReorder={placeSlots}
            onOpen={setSlot}
            render={slotRow}
          />
        </Block>
      </div>

      {slot && <MenuSlotModal slot={slot} onClose={() => setSlot(null)} />}
      {tile !== undefined && (
        <InfoTileModal brand={brand} tile={tile} onClose={() => setTile(undefined)} />
      )}
    </div>
  )
}
