import {
  AtSign,
  Camera,
  Clock,
  Globe,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Send,
  Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { logAction } from '@/entities/audit/audit'
import {
  branchesStore,
  brandContactsStore,
  REGIONS,
  type Branch,
  type Region,
} from '@/entities/microloans/brandContacts'
import { WORKSPACE_INFO, type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatPhone } from '@/shared/lib/phone'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FilterSelect } from '@/shared/ui/FilterSelect'
import { PageHeader } from '@/shared/ui/PageHeader'
import { RowActions } from '@/shared/ui/RowActions'
import { BranchModal } from '../components/BranchModal'
import { BrandContactsModal } from '../components/BrandContactsModal'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

/**
 * Kontaktlar va filiallar of a microloan brand, as its app's Kontaktlar shows them: on the right
 * the phones, email, socials, head office and hours; the branches by region in the table. A row
 * opens the branch in a modal.
 */
export function BrandContactsPage({ brand }: { brand: Brand }) {
  const { t, tl } = useI18n()
  const contacts = brandContactsStore.useAll().find((item) => item.id === brand)!
  const all = branchesStore
    .useAll()
    .filter((branch) => branch.brand === brand)
    .sort((a, b) => REGIONS.indexOf(a.region) - REGIONS.indexOf(b.region))
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState<'' | Region>('')
  // undefined: closed; null: adding; a branch: editing it
  const [editing, setEditing] = useState<Branch | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Branch | null>(null)
  const [editingContacts, setEditingContacts] = useState(false)

  const needle = query.trim().toLowerCase()
  const rows = all.filter(
    (branch) =>
      (!region || branch.region === region) &&
      (needle === '' ||
        branch.address.toLowerCase().includes(needle) ||
        !!branch.phone?.includes(needle.replace(/\D/g, '') || '—')),
  )
  const regions = REGIONS.filter((value) => all.some((branch) => branch.region === value))

  const info: [LucideIcon, string, string][] = [
    ...contacts.phones.map((phone, i): [LucideIcon, string, string] => [
      Phone,
      t(i === 0 ? 'mlContacts.phone' : 'mlContacts.phone2'),
      formatPhone(phone),
    ]),
    [AtSign, t('mlContacts.email'), contacts.email],
    ...(contacts.telegram
      ? [[Send, 'Telegram', `@${contacts.telegram}`] as [LucideIcon, string, string]]
      : []),
    ...(contacts.instagram
      ? [[Camera, 'Instagram', `@${contacts.instagram}`] as [LucideIcon, string, string]]
      : []),
    [Globe, t('mlContacts.website'), contacts.website],
    [MapPin, t('mlContacts.office'), tl(contacts.address)],
    [Clock, t('mlContacts.hours'), tl(contacts.hours)],
  ]

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader
        title={t('nav.contacts')}
        actions={
          <Button onClick={() => setEditing(null)}>
            <Plus size={20} />
            {t('mlContacts.branch.add')}
          </Button>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="flex min-w-0 flex-col rounded-card border border-line bg-canvas">
          <div className="flex flex-wrap items-center gap-2 p-4">
            <h2 className="mr-2 text-lg font-bold">
              {t('mlContacts.branches')}{' '}
              <span className="font-normal text-ink-muted tabular-nums">{all.length}</span>
            </h2>
            <label className="flex h-10 min-w-48 flex-1 items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
              <Search size={18} className="shrink-0" />
              <span className="sr-only">{t('mlContacts.search')}</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('mlContacts.search')}
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
              />
            </label>
            <FilterSelect
              label={t('mlContacts.region')}
              options={[
                { value: '', label: t('mlContacts.region.all') },
                ...regions.map((value) => ({ value, label: t(`region.${value}`) })),
              ]}
              value={region}
              onChange={setRegion}
            />
          </div>
          {rows.length === 0 ? (
            <EmptyState title={t('mlContacts.empty')} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-t border-line">
                <thead>
                  <tr className="border-b border-line">
                    <th className={`${th} w-44`}>{t('mlContacts.region')}</th>
                    <th className={th}>{t('mlContacts.address')}</th>
                    <th className={`${th} w-44`}>{t('mlContacts.branch.phone')}</th>
                    <th className="w-24" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((branch, i) => (
                    <tr
                      key={branch.id}
                      onClick={() => setEditing(branch)}
                      className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
                    >
                      <td className="px-4 py-3 text-sm font-semibold">
                        {/* The region once, on its first row */}
                        {rows[i - 1]?.region !== branch.region && t(`region.${branch.region}`)}
                      </td>
                      <td className="px-4 py-3 text-sm">{branch.address}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap tabular-nums">
                        {branch.phone ? formatPhone(branch.phone) : '—'}
                      </td>
                      <td className="pr-3">
                        <RowActions
                          actions={[
                            {
                              icon: Pencil,
                              label: t('common.edit'),
                              onClick: () => setEditing(branch),
                            },
                            {
                              icon: Trash2,
                              label: t('common.delete'),
                              onClick: () => setDeleting(branch),
                              danger: true,
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-3 lg:sticky lg:top-6">
          <section className="flex flex-col gap-3 rounded-card border border-line bg-canvas p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">{t('mlContacts.contacts')}</h2>
              <Button size="sm" variant="ghost" onClick={() => setEditingContacts(true)}>
                <Pencil size={16} />
                {t('common.edit')}
              </Button>
            </div>
            <ul className="flex flex-col">
              {info.map(([Icon, label, value]) => (
                <li
                  key={label}
                  className="flex items-start gap-3 border-b border-line py-2.5 last:border-b-0"
                >
                  <Icon size={18} className="mt-0.5 shrink-0 text-brand" />
                  <div className="flex min-w-0 flex-col">
                    <span className="text-xs text-ink-muted">{label}</span>
                    <span className="text-sm font-semibold break-words">{value}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <p className="px-1 text-xs text-ink-subtle">{t('mlContacts.inApp')}</p>
        </aside>
      </div>

      {editing !== undefined && (
        <BranchModal
          brand={brand}
          branch={editing}
          onClose={() => setEditing(undefined)}
          onDelete={(branch) => {
            setEditing(undefined)
            setDeleting(branch)
          }}
        />
      )}
      {editingContacts && (
        <BrandContactsModal contacts={contacts} onClose={() => setEditingContacts(false)} />
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={t('mlContacts.branch.delete.title')}
        confirmLabel={t('common.delete')}
        onConfirm={() => {
          if (deleting) {
            branchesStore.remove(deleting.id)
            logAction({
              section: 'mlContacts',
              kind: 'delete',
              action: 'audit.a.loanBranchDeleted',
              params: { brand: WORKSPACE_INFO[brand].name },
              target: deleting.address,
            })
          }
          setDeleting(null)
          toast(t('mlContacts.branch.deleted'))
        }}
      >
        <p>{t('mlContacts.branch.delete.message', { address: deleting?.address ?? '' })}</p>
      </ConfirmDialog>
    </div>
  )
}
