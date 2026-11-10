import { MapPin, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { REGIONS, type Branch, type Region } from '@/entities/microloans/brandContacts'
import {
  branchesApi,
  resolveAddress,
  suggestAddress,
  type GeoSuggestion,
} from '@/entities/microloans/brandContactsApi'
import { attempt } from '@/shared/api/createRemoteStore'
import { toastError } from '@/shared/api/errors'
import { type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { PHONE_DIGITS } from '@/shared/lib/phone'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { Checkbox } from '@/shared/ui/Checkbox'
import { Modal } from '@/shared/ui/Modal'
import { PhoneField } from '@/shared/ui/PhoneField'
import { SelectField } from '@/shared/ui/SelectField'
import { TextField } from '@/shared/ui/TextField'

type Props = {
  brand: Brand
  /** The branch to edit, or null to add one. */
  branch: Branch | null
  onClose: () => void
  onDelete: (branch: Branch) => void
}

type Day = { on: boolean; open: string; close: string }
/** ISO weekdays, Monday first. */
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

const daysOf = (schedule: Branch['schedule']): Day[] =>
  WEEKDAYS.map((weekday) => {
    const found = schedule.find((item) => item.weekday === weekday)
    return found
      ? { on: true, open: found.open, close: found.close }
      : { on: false, open: '09:00', close: '18:00' }
  })

const coord = (text: string) => (text.trim() === '' ? NaN : Number(text.replace(',', '.')))

/**
 * Add or edit a branch: its region, the address as the app shows it (with Yandex suggestions that
 * also give the map pin), the pin's coordinates, its phone and the working days with their hours.
 */
export function BranchModal({ brand, branch, onClose, onDelete }: Props) {
  const { t } = useI18n()
  const [region, setRegion] = useState<Region>(branch?.region ?? 'fergana')
  const [address, setAddress] = useState(branch?.address ?? '')
  const [phone, setPhone] = useState(branch?.phone ?? '')
  const [lat, setLat] = useState(branch?.location ? String(branch.location.lat) : '')
  const [lng, setLng] = useState(branch?.location ? String(branch.location.lng) : '')
  const [days, setDays] = useState<Day[]>(daysOf(branch?.schedule ?? []))
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([])
  const [searching, setSearching] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  // Suggestions follow the typing after a pause, from three letters on; the pick fills the pin
  useEffect(() => {
    const text = searching.trim()
    if (text.length < 3) return
    let alive = true
    const id = setTimeout(() => {
      suggestAddress(text)
        .then((data) => alive && setSuggestions(data.items))
        .catch((e) => alive && (setSuggestions([]), toastError(e)))
    }, 400)
    return () => {
      alive = false
      clearTimeout(id)
    }
  }, [searching])

  const pick = async (item: GeoSuggestion) => {
    setSuggestions([])
    setSearching('')
    await attempt(async () => {
      const found = await resolveAddress(item.uri)
      setLat(String(found.location.lat))
      setLng(String(found.location.lng))
      setAddress(found.address)
    })
  }

  const hasPin = lat.trim() !== '' || lng.trim() !== ''
  const pinOk =
    !hasPin || (coord(lat) >= 37 && coord(lat) <= 46 && coord(lng) >= 55 && coord(lng) <= 74)
  const badDay = days.some((day) => day.on && !(day.open && day.close && day.open < day.close))
  const errors = {
    address: address.trim().length < 5 ? t('error.required') : undefined,
    phone: phone && phone.length !== PHONE_DIGITS ? t('mlContacts.error.phone') : undefined,
    pin: !pinOk ? t('mlContacts.error.pin') : undefined,
    schedule: badDay ? t('mlContacts.error.schedule') : undefined,
  }

  const save = async () => {
    setSubmitted(true)
    if (Object.values(errors).some(Boolean)) return
    const record = {
      region,
      address: address.trim(),
      phone: phone || undefined,
      location: hasPin ? { lat: coord(lat), lng: coord(lng) } : undefined,
      schedule: days.flatMap((day, i) =>
        day.on ? [{ weekday: WEEKDAYS[i], open: day.open, close: day.close }] : [],
      ),
    }
    setSaving(true)
    const ok = await attempt(
      () =>
        branch ? branchesApi.update(brand, branch.id, record) : branchesApi.create(brand, record),
      () => toast(t(branch ? 'toast.saved' : 'mlContacts.branch.added')),
    )
    setSaving(false)
    if (ok) onClose()
  }

  const setDay = (i: number, patch: Partial<Day>) =>
    setDays(days.map((day, index) => (index === i ? { ...day, ...patch } : day)))

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={t('mlContacts.branches')}
      title={branch ? branch.address : t('mlContacts.branch.new')}
      footer={
        <>
          {branch && (
            <Button
              size="sm"
              variant="ghost"
              className="mr-auto text-danger!"
              onClick={() => onDelete(branch)}
            >
              <Trash2 size={18} />
              {t('common.delete')}
            </Button>
          )}
          <Button size="sm" variant="ghost" className="ml-auto px-4!" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" className="px-4!" loading={saving} onClick={() => void save()}>
            {t(branch ? 'common.save' : 'common.add')}
          </Button>
        </>
      }
    >
      <SelectField
        label={t('mlContacts.region')}
        options={REGIONS.map((value) => ({ value, label: t(`region.${value}`) }))}
        value={region}
        onChange={setRegion}
      />
      <div className="relative flex flex-col">
        <TextField
          label={t('mlContacts.address')}
          placeholder={t('mlContacts.address.placeholder')}
          value={address}
          onChange={(e) => {
            setAddress(e.target.value)
            setSearching(e.target.value)
            if (e.target.value.trim().length < 3) setSuggestions([])
          }}
          hint={t('mlContacts.address.suggestHint')}
          error={submitted ? errors.address : undefined}
        />
        {suggestions.length > 0 && (
          <ul className="absolute top-full right-0 left-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-control border border-line bg-canvas p-1 shadow-xl">
            {suggestions.map((item) => (
              <li key={item.uri}>
                <button
                  type="button"
                  onClick={() => void pick(item)}
                  className="flex w-full items-start gap-2 rounded-control p-2 text-left text-sm hover:bg-surface"
                >
                  <MapPin size={16} className="mt-0.5 shrink-0 text-brand" />
                  <span className="flex min-w-0 flex-col">
                    <span className="font-semibold">{item.title}</span>
                    <span className="text-ink-muted">{item.subtitle}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t('mlContacts.lat')}
          inputMode="decimal"
          placeholder="41.311081"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          error={submitted ? errors.pin : undefined}
        />
        <TextField
          label={t('mlContacts.lng')}
          inputMode="decimal"
          placeholder="69.240562"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          hint={hasPin && pinOk ? undefined : t('mlContacts.pin.hint')}
        />
      </div>
      {hasPin && pinOk && (
        <a
          href={`https://yandex.com/maps/?pt=${coord(lng)},${coord(lat)}&z=16&l=map`}
          target="_blank"
          rel="noreferrer"
          className="-mt-2 self-start text-sm font-semibold text-brand hover:underline"
        >
          {t('mlContacts.pin.open')}
        </a>
      )}
      <PhoneField
        label={t('mlContacts.branch.phone')}
        value={phone}
        onChange={setPhone}
        hint={t('mlContacts.optional')}
        error={submitted ? errors.phone : undefined}
      />
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-ink-muted">{t('mlContacts.schedule')}</p>
        {days.map((day, i) => (
          <div key={DAY_KEYS[i]} className="grid grid-cols-[130px_1fr_1fr] items-center gap-3">
            <Checkbox
              label={t(`weekday.${DAY_KEYS[i]}`)}
              checked={day.on}
              onChange={(on) => setDay(i, { on })}
            />
            <TextField
              label={t('mlContacts.open')}
              type="time"
              disabled={!day.on}
              value={day.open}
              onChange={(e) => setDay(i, { open: e.target.value })}
            />
            <TextField
              label={t('mlContacts.close')}
              type="time"
              disabled={!day.on}
              value={day.close}
              onChange={(e) => setDay(i, { close: e.target.value })}
            />
          </div>
        ))}
        <p
          className={cn(
            'text-sm',
            submitted && errors.schedule ? 'text-danger' : 'text-ink-subtle',
          )}
        >
          {submitted && errors.schedule ? errors.schedule : t('mlContacts.schedule.hint')}
        </p>
      </div>
    </Modal>
  )
}
