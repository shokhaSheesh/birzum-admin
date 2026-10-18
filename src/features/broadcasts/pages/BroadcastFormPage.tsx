import { CalendarClock, Send, Store, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  broadcastsStore,
  CLIENT_SEGMENTS,
  type Audience,
  type Broadcast,
  type BroadcastLink,
  type ClientSegment,
} from '@/entities/broadcasts/broadcasts'
import { categoriesStore, rootsOf } from '@/entities/catalog/categories'
import { MerchantLogo } from '@/entities/merchants/ui/MerchantLogo'
import { useAdmin } from '@/entities/session/session'
import { broadcastPath, ROUTES } from '@/shared/config/routes'
import { LANGS, type Lang } from '@/shared/i18n/dictionaries'
import { emptyText, isComplete } from '@/shared/i18n/localized'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { newId } from '@/shared/lib/createStore'
import { parseDate, startOfDay } from '@/shared/lib/dates'
import { formatDate, groupDigits } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { ActionBar } from '@/shared/ui/ActionBar'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Checkbox } from '@/shared/ui/Checkbox'
import { ChoiceGrid } from '@/shared/ui/ChoiceGrid'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { DateField } from '@/shared/ui/DateField'
import { FormSection } from '@/shared/ui/FormSection'
import { ImageField } from '@/shared/ui/ImageField'
import { LocalizedTextField } from '@/shared/ui/LocalizedTextField'
import { SelectField } from '@/shared/ui/SelectField'
import { statsFor } from '@/entities/broadcasts/broadcasts'
import { PhonePreview } from '../components/PhonePreview'
import { useAudience } from '../model/audience'

const now = () => new Date()
/** Sending hours: 08:00 to 21:30, every half hour, so nobody gets a push at night. */
const TIMES = Array.from({ length: 28 }, (_, i) => {
  const minutes = 8 * 60 + i * 30
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
})
const SMS_LIMIT = 160

/**
 * Write a broadcast: who gets it, the text in both languages with an optional picture and
 * what it opens, the channels, and when. A phone on the right shows it as it will arrive.
 */
export function BroadcastFormPage() {
  const { t, tl, lang: appLang } = useI18n()
  const navigate = useNavigate()
  const admin = useAdmin()
  const { id } = useParams()
  const existing = broadcastsStore.useAll().find((item) => item.id === id)
  const categories = categoriesStore.useAll()
  const { segments, merchants, countOf } = useAudience()

  const [kind, setKind] = useState<Audience['kind']>(existing?.audience.kind ?? 'clients')
  const [segment, setSegment] = useState<ClientSegment>(
    existing?.audience.kind === 'clients' ? existing.audience.segment : 'all',
  )
  const [picked, setPicked] = useState<string[]>(
    existing?.audience.kind === 'merchants' ? existing.audience.merchantIds : [],
  )
  const [title, setTitle] = useState(existing?.title ?? emptyText())
  const [body, setBody] = useState(existing?.body ?? emptyText())
  const [image, setImage] = useState(existing?.image)
  const [link, setLink] = useState<BroadcastLink>(existing?.link ?? { kind: 'none' })
  const [sms, setSms] = useState(existing?.sms ?? false)
  const [when, setWhen] = useState<'now' | 'later'>(
    existing?.status === 'scheduled' ? 'later' : 'now',
  )
  const [day, setDay] = useState(existing?.sendAt ? formatDate(existing.sendAt) : '')
  const [time, setTime] = useState(
    existing?.sendAt
      ? `${String(existing.sendAt.getHours()).padStart(2, '0')}:${String(existing.sendAt.getMinutes()).padStart(2, '0')}`
      : '10:00',
  )
  const [previewLang, setPreviewLang] = useState<Lang>(appLang)
  const [submitted, setSubmitted] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const audience: Audience = kind === 'clients' ? { kind, segment } : { kind, merchantIds: picked }
  const reach = countOf(audience)
  const smsOn = kind === 'clients' && sms
  const sendDate = (() => {
    const date = parseDate(day)
    if (!date) return null
    const [h, m] = time.split(':').map(Number)
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m)
  })()
  const smsLength = Math.max(...LANGS.map((l) => `${title[l]}. ${body[l]}`.length))
  const errors = {
    title: !isComplete(title),
    body: !isComplete(body),
    date:
      when === 'later'
        ? !sendDate
          ? t('error.required')
          : sendDate <= now()
            ? t('broadcast.error.past')
            : undefined
        : undefined,
    sms:
      smsOn && smsLength > SMS_LIMIT
        ? t('broadcast.error.sms', { max: String(SMS_LIMIT) })
        : undefined,
    reach: reach === 0 ? t('broadcast.error.nobody') : undefined,
  }
  const valid = !errors.title && !errors.body && !errors.date && !errors.sms && !errors.reach

  const store = (status: Broadcast['status']) => {
    const record: Broadcast = {
      id: existing?.id ?? newId(),
      audience,
      sms: smsOn,
      title: { uz: title.uz.trim(), ru: title.ru.trim() },
      body: { uz: body.uz.trim(), ru: body.ru.trim() },
      image,
      link: kind === 'clients' ? link : { kind: 'none' },
      status,
      sendAt: status === 'sent' ? now() : status === 'scheduled' ? sendDate! : undefined,
      createdAt: existing?.createdAt ?? now(),
      createdBy: existing?.createdBy ?? admin?.name ?? '—',
      stats: status === 'sent' ? { ...statsFor(reach, reach), opened: 0, tapped: 0 } : undefined,
    }
    broadcastsStore.save(record)
    return record
  }
  const saveDraft = () => {
    store('draft')
    toast(t('broadcast.drafted'))
    navigate(ROUTES.broadcasts)
  }
  const ask = () => {
    setSubmitted(true)
    if (valid) setConfirming(true)
  }
  const send = () => {
    const record = store(when === 'now' ? 'sent' : 'scheduled')
    toast(t(when === 'now' ? 'broadcast.sent' : 'broadcast.scheduled'))
    navigate(broadcastPath(record.id))
  }

  const linkOptions = [
    { value: 'none', label: t('broadcast.link.none') },
    ...rootsOf(categories)
      .filter((c) => c.visible)
      .map((c) => ({
        value: `category:${c.id}`,
        label: `${t('broadcast.link.category')}: ${tl(c.name)}`,
      })),
    ...merchants.map((m) => ({
      value: `merchant:${m.id}`,
      label: `${t('broadcast.link.merchant')}: ${m.name}`,
    })),
  ]
  const linkValue = link.kind === 'none' ? 'none' : `${link.kind}:${link.id}`
  const linkLabel =
    kind === 'clients' && link.kind !== 'none'
      ? t(link.kind === 'category' ? 'broadcast.link.openCategory' : 'broadcast.link.openMerchant')
      : undefined

  return (
    <>
      <ActionBar
        eyebrow={t('nav.broadcasts')}
        title={existing ? tl(existing.title) || t('broadcast.new') : t('broadcast.new')}
        onBack={() => navigate(ROUTES.broadcasts)}
      >
        <Button
          size="sm"
          variant="ghost"
          className="px-4!"
          onClick={() => navigate(ROUTES.broadcasts)}
        >
          {t('common.cancel')}
        </Button>
        <Button size="sm" variant="secondary" className="px-4!" onClick={saveDraft}>
          {t('broadcast.saveDraft')}
        </Button>
        <Button size="sm" className="px-4!" onClick={ask}>
          {when === 'now' ? <Send size={18} /> : <CalendarClock size={18} />}
          {t(when === 'now' ? 'broadcast.send' : 'broadcast.schedule')}
        </Button>
      </ActionBar>

      <div className="mx-auto grid w-full max-w-page items-start gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="flex flex-col gap-6">
          <FormSection title={t('broadcast.audience')} hint={t('broadcast.audience.hint')}>
            <ChoiceGrid
              label={t('broadcast.audience.kind')}
              columns={2}
              options={[
                { value: 'clients', label: t('nav.customers'), icon: Users },
                { value: 'merchants', label: t('nav.merchants'), icon: Store },
              ]}
              value={kind}
              onChange={setKind}
            />
            {kind === 'clients' ? (
              <SelectField
                label={t('broadcast.segment')}
                options={CLIENT_SEGMENTS.map((value) => ({
                  value,
                  label: `${t(`broadcast.segment.${value}`)} · ${groupDigits(segments[value])}`,
                }))}
                value={segment}
                onChange={setSegment}
                hint={t(`broadcast.segment.${segment}.hint`)}
              />
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-ink-muted">{t('broadcast.merchants')}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {merchants.map((merchant) => {
                    const on = picked.includes(merchant.id)
                    return (
                      <label
                        key={merchant.id}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-control border-[1.5px] p-3',
                          on ? 'border-primary bg-green-200' : 'border-line hover:bg-surface',
                        )}
                      >
                        <MerchantLogo merchant={merchant} size="sm" />
                        <span className="flex-1 font-semibold">{merchant.name}</span>
                        <Checkbox
                          label={<span className="sr-only">{merchant.name}</span>}
                          checked={on}
                          onChange={(value) =>
                            setPicked(
                              value
                                ? [...picked, merchant.id]
                                : picked.filter((m) => m !== merchant.id),
                            )
                          }
                        />
                      </label>
                    )
                  })}
                </div>
                <p className="text-sm text-ink-subtle">{t('broadcast.merchants.hint')}</p>
              </div>
            )}
          </FormSection>

          <FormSection title={t('broadcast.content')} hint={t('broadcast.content.hint')}>
            <LocalizedTextField
              label={t('broadcast.title')}
              placeholder={t('broadcast.title.placeholder')}
              value={title}
              onChange={setTitle}
              requireBoth={submitted}
            />
            <LocalizedTextField
              label={t('broadcast.body')}
              placeholder={t('broadcast.body.placeholder')}
              value={body}
              onChange={setBody}
              multiline
              requireBoth={submitted}
            />
            <ImageField
              label={t('broadcast.image')}
              hint={t('broadcast.image.hint')}
              preview={
                image ? (
                  <img src={image} alt="" className="h-20 w-40 rounded-control object-cover" />
                ) : (
                  <span className="grid h-20 w-40 place-items-center rounded-control bg-surface text-xs text-ink-subtle">
                    2 : 1
                  </span>
                )
              }
              value={image}
              onChange={setImage}
            />
            {kind === 'clients' && (
              <SelectField
                label={t('broadcast.link')}
                hint={t('broadcast.link.hint')}
                options={linkOptions}
                value={linkValue}
                onChange={(value) => {
                  const [k, target] = value.split(':')
                  setLink(
                    k === 'none'
                      ? { kind: 'none' }
                      : { kind: k as 'category' | 'merchant', id: target },
                  )
                }}
              />
            )}
          </FormSection>

          <FormSection title={t('broadcast.delivery')} hint={t('broadcast.delivery.hint')}>
            <div className="flex flex-col gap-3 rounded-control bg-surface p-4 text-sm">
              <p className="font-semibold">{t('broadcast.channel.push')}</p>
              <p className="-mt-2 text-ink-muted">{t('broadcast.channel.push.hint')}</p>
              {kind === 'clients' && (
                <Checkbox
                  label={t('broadcast.channel.sms')}
                  description={t('broadcast.channel.sms.hint', {
                    length: String(smsLength),
                    max: String(SMS_LIMIT),
                  })}
                  checked={sms}
                  onChange={setSms}
                  error={submitted ? errors.sms : undefined}
                />
              )}
            </div>
            <ChoiceGrid
              label={t('broadcast.when')}
              columns={2}
              options={[
                { value: 'now', label: t('broadcast.when.now'), icon: Send },
                { value: 'later', label: t('broadcast.when.later'), icon: CalendarClock },
              ]}
              value={when}
              onChange={setWhen}
            />
            {when === 'later' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <DateField
                  label={t('broadcast.date')}
                  placeholder="dd.mm.yyyy"
                  value={day}
                  onChange={setDay}
                  error={submitted ? errors.date : undefined}
                />
                <SelectField
                  label={t('broadcast.time')}
                  hint={t('broadcast.time.hint')}
                  options={TIMES.map((value) => ({ value, label: value }))}
                  value={time}
                  onChange={setTime}
                />
              </div>
            )}
          </FormSection>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <p className="font-bold">{t('broadcast.preview')}</p>
            <div className="flex gap-0.5 rounded-full bg-surface p-0.5">
              {LANGS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPreviewLang(value)}
                  aria-pressed={previewLang === value}
                  className={cn(
                    'h-7 rounded-full px-3 text-xs font-bold uppercase',
                    previewLang === value ? 'bg-canvas text-ink shadow-sm' : 'text-ink-muted',
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <PhonePreview
            lang={previewLang}
            title={title}
            body={body}
            image={image}
            sms={smsOn}
            appName={kind === 'clients' ? 'Birzum' : 'Birzum Biznes'}
            linkLabel={linkLabel}
          />
          <p className="text-center text-xs text-ink-subtle">{t('broadcast.preview.langHint')}</p>
          <dl className="flex flex-col gap-2 rounded-card border border-line bg-canvas p-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">{t('broadcast.reach')}</dt>
              <dd className="font-bold tabular-nums">{groupDigits(reach)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">{t('broadcast.channels')}</dt>
              <dd className="font-semibold">
                {t('broadcast.channel.push')}
                {smsOn && ` + SMS`}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">{t('broadcast.when')}</dt>
              <dd className="font-semibold tabular-nums">
                {when === 'now'
                  ? t('broadcast.when.now')
                  : sendDate
                    ? `${formatDate(sendDate)}, ${time}`
                    : '—'}
              </dd>
            </div>
          </dl>
          {submitted && errors.reach && <Alert message={errors.reach} />}
        </aside>
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        tone="primary"
        title={t(when === 'now' ? 'broadcast.confirm.now' : 'broadcast.confirm.later', {
          count: groupDigits(reach),
        })}
        confirmLabel={t(when === 'now' ? 'broadcast.send' : 'broadcast.schedule')}
        onConfirm={send}
      >
        <p>
          {when === 'now'
            ? t('broadcast.confirm.nowHint')
            : t('broadcast.confirm.laterHint', {
                date:
                  sendDate && sendDate > startOfDay(now())
                    ? `${formatDate(sendDate)}, ${time}`
                    : '',
              })}
        </p>
      </ConfirmDialog>
    </>
  )
}
