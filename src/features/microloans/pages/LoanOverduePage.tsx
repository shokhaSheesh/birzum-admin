import { BellRing, PhoneCall, Search } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AGE_BUCKETS, ageBucketOf, type AgeBucket } from '@/entities/clients/debt'
import {
  contactsOfLoan,
  loanContactsStore,
  promiseOfLoan,
} from '@/entities/microloans/loanContacts'
import { daysLate, lateOf, loansStore, progressOf, type Loan } from '@/entities/microloans/loans'
import { loanProductsStore } from '@/entities/microloans/products'
import { brandLoanPath, type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { startOfDay } from '@/shared/lib/dates'
import { formatDate, formatSum } from '@/shared/lib/format'
import { formatPhone } from '@/shared/lib/phone'
import { usePagination } from '@/shared/lib/usePagination'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FilterSelect } from '@/shared/ui/FilterSelect'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { RowActions } from '@/shared/ui/RowActions'
import { StatCard } from '@/shared/ui/StatCard'
import { StatusBadge, type StatusTone } from '@/shared/ui/StatusBadge'
import { UnderlineTabs } from '@/shared/ui/UnderlineTabs'
import { LoanCallModal, LoanReminderDialog } from '../components/LoanContactDialogs'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
const ageTone: Record<AgeBucket, StatusTone> = {
  d7: 'warning',
  d14: 'warning',
  d30: 'danger',
  d30plus: 'danger',
}
/** Where working with a late loan stands. */
type ContactState = '' | 'none' | 'promised' | 'broken' | 'noAnswer' | 'refused'

/**
 * Kechikkanlar of one microloan brand: every loan with a payment due and not paid, as of today —
 * how much, how many days, by age; and who has been in touch: the reminders sent and the calls
 * with their result, the promised day and whether it was kept. From a row: write down a call,
 * send a reminder, or open the loan to take a payment.
 */
export function LoanOverduePage({ brand }: { brand: Brand }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [today] = useState(() => new Date())
  const loans = loansStore.useAll().filter((loan) => loan.brand === brand)
  const contacts = loanContactsStore.useAll()
  const products = loanProductsStore.useAll().filter((p) => p.brand === brand)
  const [age, setAge] = useState<'all' | AgeBucket>('all')
  const [query, setQuery] = useState('')
  const [product, setProduct] = useState('')
  const [contactState, setContactState] = useState<ContactState>('')
  const [calling, setCalling] = useState<Loan | null>(null)
  const [reminding, setReminding] = useState<Loan | null>(null)

  const late = loans
    .filter((loan) => loan.overdueSince && !loan.closedAt)
    .map((loan) => {
      const days = daysLate(loan, today)
      const promise = promiseOfLoan(contacts, loan.id)
      const lastCall = contactsOfLoan(contacts, loan.id).find((c) => c.channel === 'call')
      const state: Exclude<ContactState, ''> = !lastCall
        ? 'none'
        : lastCall.result === 'promised'
          ? promise && promise < startOfDay(today)
            ? 'broken'
            : 'promised'
          : lastCall.result === 'refused'
            ? 'refused'
            : 'noAnswer'
      return {
        loan,
        days,
        bucket: ageBucketOf(days),
        ...lateOf(loan, today),
        promise,
        lastCall,
        state,
      }
    })
    .sort((a, b) => b.days - a.days)

  const needle = query.trim().toLowerCase()
  const digits = needle.replace(/\D/g, '')
  const filtered = late.filter(
    (row) =>
      (needle === '' ||
        row.loan.borrower.name.toLowerCase().includes(needle) ||
        row.loan.number.toLowerCase().includes(needle) ||
        (digits.length >= 3 && row.loan.borrower.phone.includes(digits))) &&
      (!product || row.loan.productId === product) &&
      (!contactState || row.state === contactState),
  )
  const rows = filtered.filter((row) => age === 'all' || row.bucket === age)
  const pager = usePagination(rows, JSON.stringify([query, product, contactState, age]))

  const amount = late.reduce((sum, row) => sum + row.amount, 0)
  const principal = late.reduce((sum, row) => sum + progressOf(row.loan).principalLeft, 0)
  const promised = late.filter((row) => row.state === 'promised')
  const untouched = late.filter((row) => row.state === 'none')
  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? '—'

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader title={t('nav.overdue')} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('overdue.stat.amount')}
          value={formatSum(amount)}
          hint={t('overdue.stat.loans', { count: String(late.length) })}
        />
        <StatCard
          label={t('overdue.stat.principal')}
          value={formatSum(principal)}
          hint={t('overdue.stat.principalHint')}
        />
        <StatCard
          label={t('overdue.stat.promised')}
          value={String(promised.length)}
          hint={t('overdue.stat.promisedHint', {
            sum: formatSum(promised.reduce((sum, row) => sum + row.amount, 0)),
          })}
        />
        <StatCard
          label={t('overdue.stat.untouched')}
          value={String(untouched.length)}
          hint={t('overdue.stat.untouchedHint')}
        />
      </div>

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        <div className="px-4 pt-2">
          <UnderlineTabs
            label={t('overdue.age')}
            options={[
              { value: 'all', label: t('common.all'), count: filtered.length },
              ...AGE_BUCKETS.map((value) => ({
                value,
                label: t(`overdue.age.${value}`),
                count: filtered.filter((row) => row.bucket === value).length,
              })),
            ]}
            value={age}
            onChange={setAge}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 p-4">
          <label className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
            <Search size={18} className="shrink-0" />
            <span className="sr-only">{t('loanPay.search')}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('loanPay.search')}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            />
          </label>
          <FilterSelect
            label={t('mlProducts.col.product')}
            options={[
              { value: '', label: t('loanApps.allProducts') },
              ...products.map((item) => ({ value: item.id, label: item.name })),
            ]}
            value={product}
            onChange={setProduct}
          />
          <FilterSelect
            label={t('overdue.contact')}
            options={[
              { value: '', label: t('overdue.contact.all') },
              ...(['none', 'promised', 'broken', 'noAnswer', 'refused'] as const).map((value) => ({
                value,
                label: t(`overdue.contact.${value}`),
              })),
            ]}
            value={contactState}
            onChange={setContactState}
          />
        </div>

        {rows.length === 0 ? (
          <EmptyState title={t('overdue.empty')} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] border-t border-line">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>{t('loanApps.col.borrower')}</th>
                    <th className={th}>{t('loans.col.contract')}</th>
                    <th className={`${th} text-right`}>{t('overdue.col.amount')}</th>
                    <th className={th}>{t('overdue.col.days')}</th>
                    <th className={`${th} text-right`}>{t('loans.col.left')}</th>
                    <th className={th}>{t('overdue.col.contact')}</th>
                    <th className="w-24" />
                  </tr>
                </thead>
                <tbody>
                  {pager.rows.map((row) => (
                    <tr
                      key={row.loan.id}
                      onClick={() => navigate(brandLoanPath(brand, row.loan.id))}
                      className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
                    >
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate">{row.loan.borrower.name}</span>
                          <span className="text-sm whitespace-nowrap text-ink-muted tabular-nums">
                            {formatPhone(row.loan.borrower.phone)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={brandLoanPath(brand, row.loan.id)}
                          className="font-semibold whitespace-nowrap text-brand hover:underline"
                        >
                          {row.loan.number}
                        </Link>
                        <span className="block text-ink-muted">
                          {productName(row.loan.productId)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col">
                          <span className="font-semibold whitespace-nowrap text-danger tabular-nums">
                            {formatSum(row.amount)}
                          </span>
                          <span className="text-sm whitespace-nowrap text-ink-muted">
                            {t('overdue.months', { count: String(row.months.length) })}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge tone={ageTone[row.bucket]}>
                            {t('loans.lateDays', { days: String(row.days) })}
                          </StatusBadge>
                          <span className="text-xs text-ink-muted tabular-nums">
                            {t('overdue.since', { date: formatDate(row.loan.overdueSince!) })}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm whitespace-nowrap tabular-nums">
                        {formatSum(progressOf(row.loan).principalLeft)}
                      </td>
                      <td className="max-w-72 px-4 py-3 text-sm">
                        {row.lastCall ? (
                          <div className="flex flex-col">
                            <span
                              className={cn(
                                'font-medium',
                                row.state === 'broken' || row.state === 'refused'
                                  ? 'text-danger'
                                  : row.state === 'promised' && 'text-success',
                              )}
                            >
                              {row.state === 'promised' && row.promise
                                ? t('contact.promise', { date: formatDate(row.promise) })
                                : row.state === 'broken' && row.promise
                                  ? t('contact.promiseBroken', { date: formatDate(row.promise) })
                                  : t(`contact.result.${row.lastCall.result ?? 'noAnswer'}`)}
                            </span>
                            <span className="text-xs text-ink-muted">
                              {formatDate(row.lastCall.at)} · {row.lastCall.by}
                            </span>
                          </div>
                        ) : (
                          <span className="text-ink-muted">{t('contact.empty')}</span>
                        )}
                      </td>
                      <td className="pr-3" onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          actions={[
                            {
                              icon: PhoneCall,
                              label: t('contact.call'),
                              onClick: () => setCalling(row.loan),
                            },
                            {
                              icon: BellRing,
                              label: t('contact.remind'),
                              onClick: () => setReminding(row.loan),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pager={pager} />
          </>
        )}
      </div>

      {calling && <LoanCallModal loan={calling} onClose={() => setCalling(null)} />}
      {reminding && (
        <LoanReminderDialog
          loan={reminding}
          amount={lateOf(reminding, today).amount}
          days={daysLate(reminding, today)}
          onClose={() => setReminding(null)}
        />
      )}
    </div>
  )
}
