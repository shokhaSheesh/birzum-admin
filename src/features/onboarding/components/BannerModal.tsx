import { Info, LayoutGrid, MapPin, ShoppingBag, Store, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { categoriesStore } from '@/entities/catalog/categoriesApi'
import { loadProducts } from '@/entities/catalog/moderationApi'
import { targetsFor, type Banner, type BannerTargetKind } from '@/entities/onboarding/banners'
import { bannersApi } from '@/entities/onboarding/onboardingApi'
import { attempt } from '@/shared/api/createRemoteStore'
import { useResource } from '@/shared/api/useResource'
import type { AppId } from '@/entities/onboarding/slides'
import { LANGS, type Lang } from '@/shared/i18n/dictionaries'
import { useI18n } from '@/shared/i18n/useI18n'
import { parseDate } from '@/shared/lib/dates'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ChoiceGrid } from '@/shared/ui/ChoiceGrid'
import { DateField } from '@/shared/ui/DateField'
import { ImageField } from '@/shared/ui/ImageField'
import { LangToggle } from '@/shared/ui/LangToggle'
import { LocalizedTextField } from '@/shared/ui/LocalizedTextField'
import { Modal } from '@/shared/ui/Modal'
import { MultiSelectField, type MultiOption } from '@/shared/ui/MultiSelectField'
import { Switch } from '@/shared/ui/Switch'
import { TextAreaField } from '@/shared/ui/TextAreaField'
import { BannerThumb } from './BannerThumb'

type Props = {
  app: AppId
  /** The banner to edit, or null to add one at the end. */
  banner: Banner | null
  onClose: () => void
  onDelete: (banner: Banner) => void
}

const ICONS = {
  products: ShoppingBag,
  categories: LayoutGrid,
  merchants: Store,
  nearest: MapPin,
  loanProducts: ShoppingBag,
}

const filled = (text: { uz: string; ru: string }) => !!text.uz.trim() && !!text.ru.trim()

/**
 * Add or edit one Bosh sahifa banner: its picture per language, its name, what it opens (one
 * kind: products, categories, shops, or the nearest shops), its dates and whether it shows.
 */
export function BannerModal({ app, banner, onClose, onDelete }: Props) {
  const { t, tl, lang: panelLang } = useI18n()
  const categories = categoriesStore.useAll()
  // The backend has no lists of products or shops for a banner to pick from: the first 100
  // products (and the shops they belong to) stand in, with the ids the backend accepts
  const catalog = useResource(() => loadProducts({ limit: 100 }), 'banner-products')
  const products = catalog.data?.items ?? []
  const merchants = [...new Map(products.map((p) => [p.merchantId, p.merchantName]))]
  const targets = targetsFor(app)
  const [image, setImage] = useState<Partial<Record<Lang, string>>>(banner?.image ?? {})
  const [imageLang, setImageLang] = useState<Lang>(panelLang)
  const [title, setTitle] = useState(banner?.title ?? { uz: '', ru: '' })
  const [target, setTarget] = useState<BannerTargetKind>(banner?.target ?? targets[0])
  // Picks are kept per kind, so switching the kind back and forth loses nothing
  const [picks, setPicks] = useState<Record<BannerTargetKind, string[]>>({
    products: [],
    categories: [],
    merchants: [],
    nearest: [],
    loanProducts: [],
    ...(banner ? { [banner.target]: banner.ids } : {}),
  })
  const [startsOn, setStartsOn] = useState(banner?.startsOn ?? '')
  const [endsOn, setEndsOn] = useState(banner?.endsOn ?? '')
  const [visible, setVisible] = useState(banner?.visible ?? true)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  // Loan products have no endpoint yet, so their ids are typed, one per line
  const [loanIds, setLoanIds] = useState(
    (banner?.target === 'loanProducts' ? banner.ids : []).join('\n'),
  )

  const keepsDrawn = !!banner?.builtIn && !image.uz && !image.ru
  const missingImage = keepsDrawn ? [] : LANGS.filter((l) => !image[l])
  const typedIds = loanIds
    .split(/[\s,;]+/)
    .map((id) => id.trim())
    .filter(Boolean)
  const ids = target === 'nearest' ? [] : target === 'loanProducts' ? typedIds : picks[target]
  const from = parseDate(startsOn)
  const to = parseDate(endsOn)
  const errors = {
    image: missingImage.length > 0,
    title: !filled(title),
    ids: target !== 'nearest' && ids.length === 0,
    endsOn: !!(from && to && to < from),
  }

  const options: Record<Exclude<BannerTargetKind, 'nearest' | 'loanProducts'>, MultiOption[]> = {
    products: products.map((product) => ({
      value: product.id,
      label: tl(product.name),
      sub: product.merchantName,
    })),
    categories: categories.map((category) => ({
      value: category.id,
      label: tl(category.name),
      sub: category.parentId
        ? tl(categories.find((c) => c.id === category.parentId)?.name ?? { uz: '', ru: '' })
        : undefined,
    })),
    merchants: merchants.map(([id, name]) => ({ value: id, label: name })),
  }

  const save = async () => {
    setSubmitted(true)
    if (Object.values(errors).some(Boolean)) return
    const record = {
      image: keepsDrawn ? undefined : image,
      title: { uz: title.uz.trim(), ru: title.ru.trim() },
      target,
      ids,
      startsOn,
      endsOn,
      visible,
    }
    setSaving(true)
    const ok = await attempt(
      () => (banner ? bannersApi.update(app, banner.id, record) : bannersApi.create(app, record)),
      () => toast(t(banner ? 'toast.saved' : 'banners.created')),
    )
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={t(app === 'birzum' ? 'onboarding.kind.banners' : 'onboarding.kind.bannersMl')}
      title={banner ? tl(banner.title) : t('banners.new')}
      footer={
        <>
          {banner && (
            <Button
              size="sm"
              variant="ghost"
              className="mr-auto text-danger!"
              onClick={() => onDelete(banner)}
            >
              <Trash2 size={18} />
              {t('common.delete')}
            </Button>
          )}
          <Button size="sm" variant="ghost" className="ml-auto px-4!" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" className="px-4!" loading={saving} onClick={() => void save()}>
            {t(banner ? 'common.save' : 'common.add')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
        <ImageField
          label={t('slides.image')}
          hint={t(banner?.builtIn ? 'banners.image.hintBuiltIn' : 'banners.image.hint')}
          preview={
            <BannerThumb
              banner={{ image, builtIn: banner?.builtIn }}
              lang={imageLang}
              className="w-44!"
            />
          }
          value={image[imageLang]}
          onChange={(url) => setImage({ ...image, [imageLang]: url })}
          labelEnd={
            <LangToggle
              value={imageLang}
              onChange={setImageLang}
              missing={submitted ? missingImage : []}
            />
          }
        />
        {submitted && errors.image && (
          <p className="text-sm text-danger">{t('slides.image.required')}</p>
        )}
      </div>
      <LocalizedTextField
        label={t('banners.title')}
        value={title}
        onChange={setTitle}
        requireBoth={submitted}
      />
      {targets.length > 1 && (
        <ChoiceGrid
          label={t('banners.target')}
          columns={4}
          options={targets.map((value) => ({
            value,
            label: t(`banners.target.${value}`),
            icon: ICONS[value],
          }))}
          value={target}
          onChange={setTarget}
        />
      )}
      {target === 'nearest' ? (
        <p className="flex items-start gap-2 rounded-control bg-surface p-3 text-sm text-ink-muted">
          <Info size={18} className="mt-0.5 shrink-0" />
          {t('banners.target.nearest.hint')}
        </p>
      ) : target === 'loanProducts' ? (
        <TextAreaField
          label={t(`banners.pick.${target}`)}
          hint={t('banners.pick.loanIds.hint')}
          rows={3}
          value={loanIds}
          onChange={(e) => setLoanIds(e.target.value)}
          error={submitted && errors.ids ? t('banners.pick.required') : undefined}
        />
      ) : (
        <MultiSelectField
          key={target}
          label={t(`banners.pick.${target}`)}
          placeholder={t('banners.pick.placeholder')}
          options={options[target]}
          value={{ all: false, ids }}
          onChange={(next) => setPicks({ ...picks, [target]: next.ids })}
          error={submitted && errors.ids ? t('banners.pick.required') : undefined}
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <DateField
          label={t('banners.startsOn')}
          placeholder="KK.OO.YYYY"
          hint={t('banners.dates.hint')}
          value={startsOn}
          onChange={setStartsOn}
        />
        <DateField
          label={t('banners.endsOn')}
          placeholder="KK.OO.YYYY"
          value={endsOn}
          onChange={setEndsOn}
          error={submitted && errors.endsOn ? t('banners.dates.order') : undefined}
        />
      </div>
      <div className="flex items-center justify-between gap-4 rounded-control bg-surface p-4">
        <div className="flex flex-col">
          <p className="font-semibold">{t('slides.visible')}</p>
          <p className="text-sm text-ink-muted">{t('banners.visible.hint')}</p>
        </div>
        <Switch checked={visible} onChange={setVisible} label={t('slides.visible')} />
      </div>
    </Modal>
  )
}
