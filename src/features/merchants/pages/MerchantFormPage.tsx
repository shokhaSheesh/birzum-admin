import { ArrowLeft, Building2, Package, ReceiptText, Store } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  MERCHANT_STATUSES,
  merchantsStore,
  type Merchant,
  type MerchantStatus,
  type PayoutSchedule,
} from '@/entities/merchants/merchants'
import { MerchantLogo } from '@/entities/merchants/ui/MerchantLogo'
import { ROUTES } from '@/shared/config/routes'
import type { LocalizedText } from '@/shared/i18n/dictionaries'
import { emptyText } from '@/shared/i18n/localized'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { newId } from '@/shared/lib/createStore'
import { formatSum, groupDigits } from '@/shared/lib/format'
import { PHONE_DIGITS } from '@/shared/lib/phone'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ChoiceGrid } from '@/shared/ui/ChoiceGrid'
import { FormSection } from '@/shared/ui/FormSection'
import { LocalizedTextField } from '@/shared/ui/LocalizedTextField'
import { PhoneField } from '@/shared/ui/PhoneField'
import { TextField } from '@/shared/ui/TextField'
import { LogoField } from '../components/LogoField'

const digits = (value: string, max: number) => value.replace(/\D/g, '').slice(0, max)
const grid = 'grid gap-4 sm:grid-cols-2'

/** What a brand-new merchant starts with: nothing sold yet. */
const fresh = () => ({
  id: newId(),
  createdAt: new Date(),
  filials: 0,
  products: 0,
  salesThisMonth: 0,
  activeNasiya: 0,
})

/**
 * Create or edit a merchant: the shop shoppers see, the company behind it, where Birzum pays,
 * the contract terms, and the owner's first merchant-app account. A live preview sits beside.
 */
export function MerchantFormPage() {
  const { t, tl } = useI18n()
  const navigate = useNavigate()
  const { id } = useParams()
  const existing = merchantsStore.get(id)

  const [name, setName] = useState(existing?.name ?? '')
  const [logo, setLogo] = useState(existing?.logo)
  const [description, setDescription] = useState<LocalizedText>(
    existing?.description ?? emptyText(),
  )
  const [phone, setPhone] = useState(existing?.phone ?? '')
  const [legal, setLegal] = useState(
    existing?.legal ?? { company: '', inn: '', director: '', address: '' },
  )
  const [bank, setBank] = useState(existing?.bank ?? { name: '', mfo: '', account: '' })
  const [contract, setContract] = useState(existing?.contract ?? { number: '', date: '' })
  const [commission, setCommission] = useState(existing ? String(existing.commission) : '4')
  const [schedule, setSchedule] = useState<PayoutSchedule>(existing?.payoutSchedule ?? 'weekly')
  const [owner, setOwner] = useState(existing?.owner ?? { name: '', phone: '', login: '' })
  const [status, setStatus] = useState<MerchantStatus>(existing?.status ?? 'onboarding')
  const [submitted, setSubmitted] = useState(false)

  const rate = Number(commission.replace(',', '.'))
  const problems = {
    name: !name.trim(),
    phone: phone.length < PHONE_DIGITS,
    company: !legal.company.trim(),
    inn: legal.inn.length !== 9,
    director: !legal.director.trim(),
    address: !legal.address.trim(),
    bank: !bank.name.trim(),
    mfo: bank.mfo.length !== 5,
    account: bank.account.length !== 20,
    contract: !contract.number.trim(),
    date: !/^\d{2}\.\d{2}\.\d{4}$/.test(contract.date),
    commission: !(rate >= 0 && rate <= 30),
    ownerName: !owner.name.trim(),
    ownerPhone: owner.phone.length < PHONE_DIGITS,
    login: !/^[a-z0-9._]{3,}$/.test(owner.login),
  }
  const show = (key: keyof typeof problems, message = t('error.required')) =>
    submitted && problems[key] ? message : undefined

  const save = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.values(problems).some(Boolean)) {
      toast(t('merchant.error.form'), 'error')
      return
    }
    const merchant: Merchant = {
      ...(existing ?? fresh()),
      name: name.trim(),
      logo,
      description,
      phone,
      legal,
      bank,
      contract,
      commission: rate,
      payoutSchedule: schedule,
      owner,
      status,
    }
    merchantsStore.save(merchant)
    toast(t(existing ? 'toast.saved' : 'merchant.created'))
    navigate(ROUTES.merchants)
  }

  return (
    <form onSubmit={save} noValidate className="flex min-h-full flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate(ROUTES.merchants)}
            className="flex items-center gap-1.5 self-start text-sm font-semibold text-ink-muted hover:text-ink"
          >
            <ArrowLeft size={18} />
            {t('nav.merchants')}
          </button>
          <h1 className="text-2xl font-bold">{existing ? existing.name : t('merchant.new')}</h1>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-6">
            <FormSection title={t('merchant.section.shop')} hint={t('merchant.section.shop.hint')}>
              <LogoField name={name} logo={logo} onChange={setLogo} />
              <div className={grid}>
                <TextField
                  label={t('merchant.name')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={show('name')}
                />
                <PhoneField
                  label={t('merchant.phone')}
                  value={phone}
                  onChange={setPhone}
                  error={show('phone')}
                />
              </div>
              <LocalizedTextField
                label={t('merchant.description')}
                value={description}
                onChange={setDescription}
                multiline
              />
            </FormSection>

            <FormSection
              title={t('merchant.section.legal')}
              hint={t('merchant.section.legal.hint')}
            >
              <div className={grid}>
                <TextField
                  label={t('merchant.company')}
                  placeholder={'"Kompaniya" MChJ'}
                  value={legal.company}
                  onChange={(e) => setLegal({ ...legal, company: e.target.value })}
                  error={show('company')}
                />
                <TextField
                  label={t('merchants.inn')}
                  inputMode="numeric"
                  placeholder="000000000"
                  value={legal.inn}
                  onChange={(e) => setLegal({ ...legal, inn: digits(e.target.value, 9) })}
                  error={show('inn', t('merchant.error.inn'))}
                />
                <TextField
                  label={t('merchant.director')}
                  value={legal.director}
                  onChange={(e) => setLegal({ ...legal, director: e.target.value })}
                  error={show('director')}
                />
                <TextField
                  label={t('merchant.address')}
                  value={legal.address}
                  onChange={(e) => setLegal({ ...legal, address: e.target.value })}
                  error={show('address')}
                />
              </div>
            </FormSection>

            <FormSection title={t('merchant.section.bank')} hint={t('merchant.section.bank.hint')}>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
                <TextField
                  label={t('merchant.bank')}
                  value={bank.name}
                  onChange={(e) => setBank({ ...bank, name: e.target.value })}
                  error={show('bank')}
                />
                <TextField
                  label={t('merchant.mfo')}
                  inputMode="numeric"
                  placeholder="00000"
                  value={bank.mfo}
                  onChange={(e) => setBank({ ...bank, mfo: digits(e.target.value, 5) })}
                  error={show('mfo', t('merchant.error.mfo'))}
                />
              </div>
              <TextField
                label={t('merchant.account')}
                inputMode="numeric"
                placeholder="20208000000000000000"
                value={bank.account}
                onChange={(e) => setBank({ ...bank, account: digits(e.target.value, 20) })}
                error={show('account', t('merchant.error.account'))}
              />
            </FormSection>

            <FormSection
              title={t('merchant.section.contract')}
              hint={t('merchant.section.contract.hint')}
            >
              <div className={grid}>
                <TextField
                  label={t('merchant.contract')}
                  placeholder="BZ-M-0000"
                  value={contract.number}
                  onChange={(e) => setContract({ ...contract, number: e.target.value })}
                  error={show('contract')}
                />
                <TextField
                  label={t('merchant.contractDate')}
                  placeholder="KK.OO.YYYY"
                  inputMode="numeric"
                  value={contract.date}
                  onChange={(e) => setContract({ ...contract, date: e.target.value })}
                  error={show('date', t('merchant.error.date'))}
                />
                <TextField
                  label={t('merchant.commission')}
                  inputMode="decimal"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value.replace(/[^\d.,]/g, ''))}
                  trailing={<span className="text-ink-muted">%</span>}
                  hint={t('merchant.commission.hint')}
                  error={show('commission', t('merchant.error.commission'))}
                />
                <ChoiceGrid
                  label={t('merchant.schedule')}
                  columns={2}
                  options={[
                    { value: 'weekly', label: t('merchant.schedule.weekly') },
                    { value: 'monthly', label: t('merchant.schedule.monthly') },
                  ]}
                  value={schedule}
                  onChange={setSchedule}
                />
              </div>
            </FormSection>

            <FormSection
              title={t('merchant.section.owner')}
              hint={t('merchant.section.owner.hint')}
            >
              <div className={grid}>
                <TextField
                  label={t('merchant.owner')}
                  value={owner.name}
                  onChange={(e) => setOwner({ ...owner, name: e.target.value })}
                  error={show('ownerName')}
                />
                <PhoneField
                  label={t('merchant.phone')}
                  value={owner.phone}
                  onChange={(value) => setOwner({ ...owner, phone: value })}
                  error={show('ownerPhone')}
                />
                <TextField
                  label={t('login.username')}
                  placeholder="ism.familiya"
                  autoComplete="off"
                  value={owner.login}
                  onChange={(e) =>
                    setOwner({ ...owner, login: e.target.value.toLowerCase().replace(/\s/g, '') })
                  }
                  error={show('login', t('merchant.error.login'))}
                />
              </div>
            </FormSection>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
            <div
              role="radiogroup"
              aria-label={t('merchants.status')}
              className="flex flex-col gap-2 rounded-card border border-line bg-canvas p-5"
            >
              <p className="pb-1 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                {t('merchants.status')}
              </p>
              {MERCHANT_STATUSES.map((value) => {
                const selected = value === status
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setStatus(value)}
                    className={cn(
                      'flex items-start gap-3 rounded-control border-[1.5px] p-3 text-left transition-colors',
                      selected ? 'border-primary bg-green-200' : 'border-line hover:bg-surface',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2',
                        selected ? 'border-primary' : 'border-navy-400',
                      )}
                    >
                      {selected && <span className="size-2.5 rounded-full bg-primary" />}
                    </span>
                    <span className="flex flex-col">
                      <span className="font-semibold">{t(`merchant.status.${value}`)}</span>
                      <span className="text-sm text-ink-muted">
                        {t(`merchant.status.${value}.hint`)}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="flex flex-col gap-3 rounded-card border border-line bg-canvas p-5">
              <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                {t('merchant.preview')}
              </p>
              <div className="flex items-center gap-3 rounded-control bg-surface p-3">
                <MerchantLogo merchant={{ name: name || '?', logo }} />
                <div className="flex min-w-0 flex-col">
                  <p className="truncate font-semibold">{name || t('merchant.name')}</p>
                  <p className="line-clamp-2 text-sm text-ink-muted">
                    {tl(description) || t('merchant.description')}
                  </p>
                </div>
              </div>
            </div>
            {existing && (
              <div className="grid grid-cols-2 gap-3 rounded-card border border-line bg-canvas p-5">
                {[
                  {
                    icon: Building2,
                    label: t('merchants.col.filials'),
                    value: String(existing.filials),
                  },
                  {
                    icon: Package,
                    label: t('merchants.col.products'),
                    value: String(existing.products),
                  },
                  {
                    icon: ReceiptText,
                    label: t('merchants.stat.nasiya'),
                    value: groupDigits(existing.activeNasiya),
                  },
                  {
                    icon: Store,
                    label: t('merchants.col.sales'),
                    value: formatSum(existing.salesThisMonth),
                  },
                ].map((item) => (
                  <div key={item.label} className="flex min-w-0 flex-col gap-1">
                    <item.icon size={18} className="text-brand" />
                    <p className="truncate text-xs text-ink-muted">{item.label}</p>
                    <p className="truncate font-bold">{item.value}</p>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>

      <footer className="sticky bottom-0 mt-auto border-t border-line bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl justify-end gap-2 px-4 py-3 lg:px-8">
          <Button variant="ghost" onClick={() => navigate(ROUTES.merchants)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit">{t(existing ? 'common.save' : 'merchant.create')}</Button>
        </div>
      </footer>
    </form>
  )
}
