import { Info, LayoutGrid, MapPin, ShoppingBag, Store, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { logAction } from '@/entities/audit/audit'
import { categoriesStore } from '@/entities/catalog/categories'
import { productsStore } from '@/entities/catalog/products'
import { loanProductsStore } from '@/entities/microloans/products'
import { merchantsStore } from '@/entities/merchants/merchants'
import {
  bannersStore,
  targetsFor,
  type Banner,
  type BannerTargetKind,
} from '@/entities/onboarding/banners'
import type { AppId } from '@/entities/onboarding/slides'
import { LANGS, type Lang } from '@/shared/i18n/dictionaries'
import { useI18n } from '@/shared/i18n/useI18n'
import { newId } from '@/shared/lib/createStore'
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
  const products = productsStore.useAll()
  const categories = categoriesStore.useAll()
  const merchants = merchantsStore.useAll()
  const loanProducts = loanProductsStore.useAll()
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

  const keepsDrawn = !!banner?.builtIn && !image.uz && !image.ru
  const missingImage = keepsDrawn ? [] : LANGS.filter((l) => !image[l])
  const ids = target === 'nearest' ? [] : picks[target]
  const from = parseDate(startsOn)
  const to = parseDate(endsOn)
  const errors = {
    image: missingImage.length > 0,
    title: !filled(title),
    ids: target !== 'nearest' && ids.length === 0,
    endsOn: !!(from && to && to < from),
  }

  const options: Record<Exclude<BannerTargetKind, 'nearest'>, MultiOption[]> = {
    products: products.map((product) => ({
      value: product.id,
      label: tl(product.name),
      sub: merchants.find((m) => m.id === product.merchantId)?.name,
    })),
    categories: categories.map((category) => ({
      value: category.id,
      label: tl(category.name),
      sub: category.parentId
        ? tl(categories.find((c) => c.id === category.parentId)?.name ?? { uz: '', ru: '' })
        : undefined,
    })),
    loanProducts: loanProducts
      .filter((product) => product.brand === app)
      .map((product) => ({ value: product.id, label: product.name, sub: tl(product.for) })),
    merchants: merchants.map((merchant) => ({
      value: merchant.id,
      label: merchant.name,
      leading: merchant.logo ? (
        <img src={merchant.logo} alt="" className="size-7 rounded-md object-cover" />
      ) : undefined,
    })),
  }

  const save = () => {
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
    if (banner) bannersStore.update(banner.id, record)
    else bannersStore.replaceAll([...bannersStore.getAll(), { id: newId(), app, ...record }])
    logAction({
      section: app === 'birzum' ? 'onboarding' : 'mlOnboarding',
      kind: banner ? 'update' : 'create',
      action: banner ? 'audit.a.bannerSaved' : 'audit.a.bannerCreated',
      target: tl(record.title),
    })
    toast(t(banner ? 'toast.saved' : 'banners.created'))
    onClose()
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
          <Button size="sm" className="px-4!" onClick={save}>
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
      ) : (
        <MultiSelectField
          key={target}
          label={t(`banners.pick.${target}`)}
          placeholder={t('banners.pick.placeholder')}
          options={options[target]}
          value={{ all: false, ids }}
          onChange={(next) => setPicks({ ...picks, [target]: next.ids })}
          hint={target === 'loanProducts' ? t('banners.pick.loanProducts.hint') : undefined}
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
