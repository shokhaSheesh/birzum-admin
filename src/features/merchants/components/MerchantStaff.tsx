import { initialsOfName } from '@/entities/admins/admins'
import { useFilialsOf } from '@/entities/merchants/filials'
import type { Merchant } from '@/entities/merchants/merchants'
import { staffStore, type MerchantUser } from '@/entities/merchants/staff'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDate, formatDateTime } from '@/shared/lib/format'
import { Avatar } from '@/shared/ui/Avatar'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusBadge } from '@/shared/ui/StatusBadge'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

/**
 * The merchant's app accounts, read-only: who, their FlexSoft role and filials, when they were
 * last in, and whether they may sign in. FlexSoft makes and changes the accounts.
 */
export function MerchantStaff({ merchant }: { merchant: Merchant }) {
  const { t, tl } = useI18n()
  const filials = useFilialsOf(merchant.id)
  const staff = staffStore.useAll().filter((user) => user.merchantId === merchant.id)
  // One line per filial, so a name never breaks in the middle
  const filialNames = (user: MerchantUser) =>
    user.filialIds.length === 0
      ? [t('staff.allFilials')]
      : user.filialIds
          .map((id) => filials.find((filial) => filial.id === id))
          .filter(Boolean)
          .map((filial) => tl(filial!.name))

  return (
    <>
      <p className="border-t border-line px-5 py-3 text-sm text-ink-muted">{t('staff.hint')}</p>
      {staff.length === 0 ? (
        <EmptyState title={t('staff.empty')} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-t border-line">
            <thead>
              <tr className="border-b border-line">
                <th className={th}>{t('admin.name')}</th>
                <th className={th}>{t('staff.role')}</th>
                <th className={th}>{t('merchant.filials')}</th>
                <th className={th}>{t('admin.lastSeen')}</th>
                <th className={th}>{t('merchants.status')}</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((user) => (
                <tr key={user.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm" initials={initialsOfName(user.name)} />
                      <div className="flex min-w-0 flex-col">
                        <span className="text-sm font-semibold whitespace-nowrap">{user.name}</span>
                        <span className="text-xs text-ink-muted">{user.login}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-navy-100 px-2.5 py-1 text-xs font-semibold text-brand">
                      {t(`staff.role.${user.role}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {filialNames(user).map((name) => (
                      <span key={name} className="block whitespace-nowrap">
                        {name}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap text-ink-muted tabular-nums">
                    {user.lastSeenAt
                      ? formatDateTime(user.lastSeenAt)
                      : t('admin.neverSeen', { date: formatDate(user.createdAt) })}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={user.status === 'active' ? 'success' : 'neutral'}>
                      {t(`admin.status.${user.status}`)}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
