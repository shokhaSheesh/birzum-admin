import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  MERCHANT_STATUSES,
  merchantsStore,
  TARIFFS,
  type Merchant,
  type MerchantStatus,
  type Tariff,
} from '@/entities/merchants/merchants'
import { MerchantLogo } from '@/entities/merchants/ui/MerchantLogo'
import { merchantPath, ROUTES } from '@/shared/config/routes'
import type { LocalizedText } from '@/shared/i18n/dictionaries'
import { emptyText } from '@/shared/i18n/localized'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { newId } from '@/shared/lib/createStore'
import { PHONE_DIGITS } from '@/shared/lib/phone'
import { toast } from '@/shared/lib/toast'
import { ActionBar } from '@/shared/ui/ActionBar'
import { Button } from '@/shared/ui/Button'
import { DateField } from '@/shared/ui/DateField'
import { FormSection } from '@/shared/ui/FormSection'
import { ImageField } from '@/shared/ui/ImageField'
import { LocalizedTextField } from '@/shared/ui/LocalizedTextField'
import { PhoneField } from '@/shared/ui/PhoneField'
import { SelectField } from '@/shared/ui/SelectField'
import { TextField } from '@/shared/ui/TextField'
import { logAction } from '@/entities/audit/audit'

const digits = (value: string, max: number) => value.replace(/\D/g, '').slice(0, max)
const grid = 'grid gap-4 sm:grid-cols-2'

/** What a brand-new merchant starts with: nothing sold yet. */
const fresh = () => ({
  id: newId(),
  createdAt: new Date(),
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
  const [tariff, setTariff] = useState<Tariff>(existing?.tariff ?? 'A')
  const [owner, setOwner] = useState(existing?.owner ?? { name: '', phone: '', login: '' })
  const [status, setStatus] = useState<MerchantStatus>(existing?.status ?? 'onboarding')
  const [submitted, setSubmitted] = useState(false)

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
      tariff,
      owner,
      status,
    }
    merchantsStore.save(merchant)
    toast(t(existing ? 'toast.saved' : 'merchant.created'))
    logAction({
      section: 'merchants',
      kind: existing ? 'update' : 'create',
      action: existing ? 'audit.a.merchantUpdated' : 'audit.a.merchantCreated',
      target: merchant.name,
      href: merchantPath(merchant.id),
    })
    navigate(merchantPath(merchant.id))
  }
  const back = existing ? merchantPath(existing.id) : ROUTES.merchants

  return (
    <form onSubmit={save} noValidate className="flex min-h-full flex-col">
      <ActionBar
        eyebrow={existing ? t('common.edit') : t('nav.merchants')}
        title={existing ? existing.name : t('merchant.new')}
        onBack={() => navigate(back)}
      >
        <Button size="sm" variant="ghost" className="px-4!" onClick={() => navigate(back)}>
          {t('common.cancel')}
        </Button>
        <Button size="sm" type="submit" className="px-4!">
          {t(existing ? 'common.save' : 'merchant.create')}
        </Button>
      </ActionBar>

      <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-6">
            <FormSection title={t('merchant.section.shop')} hint={t('merchant.section.shop.hint')}>
              <ImageField
                label={t('merchant.logo')}
                hint={t('merchant.logo.hint')}
                preview={<MerchantLogo merchant={{ name: name || '?', logo }} size="lg" />}
                value={logo}
                onChange={setLogo}
              />
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
                <DateField
                  label={t('merchant.contractDate')}
                  placeholder="KK.OO.YYYY"
                  value={contract.date}
                  onChange={(date) => setContract({ ...contract, date })}
                  error={show('date', t('merchant.error.date'))}
                />
                <SelectField
                  label={t('merchant.tariff')}
                  options={TARIFFS.map((value) => ({
                    value,
                    label: t('merchant.tariff.value', { tariff: value }),
                  }))}
                  value={tariff}
                  onChange={setTariff}
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

          <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
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
          </aside>
        </div>
      </div>
    </form>
  )
}
