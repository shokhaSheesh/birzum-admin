import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { type InfoTile, type MenuSlot } from '@/entities/microloans/appHome'
import { saveMenuSlot, tilesApi } from '@/entities/microloans/appHomeApi'
import { attempt } from '@/shared/api/createRemoteStore'
import type { Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ImageField } from '@/shared/ui/ImageField'
import { LocalizedTextField } from '@/shared/ui/LocalizedTextField'
import { Modal } from '@/shared/ui/Modal'
import { Switch } from '@/shared/ui/Switch'
import { TileThumb } from './TileThumb'

const filled = (text: { uz: string; ru: string }) => !!text.uz.trim() && !!text.ru.trim()

/** One menu button: its label in both languages and whether it shows. */
export function MenuSlotModal({ slot, onClose }: { slot: MenuSlot; onClose: () => void }) {
  const { t, tl } = useI18n()
  const [label, setLabel] = useState(slot.label)
  const [visible, setVisible] = useState(slot.visible)
  const [submitted, setSubmitted] = useState(false)

  const save = async () => {
    setSubmitted(true)
    if (!filled(label)) return
    const ok = await attempt(
      () =>
        saveMenuSlot(slot, {
          label: { uz: label.uz.trim(), ru: label.ru.trim() },
          visible: slot.locked ? true : visible,
        }),
      () => toast(t('toast.saved')),
    )
    if (ok) onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={t(slot.place === 'action' ? 'appHome.actions' : 'appHome.tabs')}
      title={tl(slot.label)}
      footer={
        <>
          <Button size="sm" variant="ghost" className="ml-auto px-4!" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" className="px-4!" onClick={() => void save()}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <LocalizedTextField
        label={t('appHome.label')}
        value={label}
        onChange={setLabel}
        requireBoth={submitted}
      />
      <div className="flex items-center justify-between gap-4 rounded-control bg-surface p-4">
        <div className="flex flex-col">
          <p className="font-semibold">{t('slides.visible')}</p>
          <p className="text-sm text-ink-muted">
            {t(slot.locked ? 'appHome.locked' : 'appHome.visible.hint')}
          </p>
        </div>
        {!slot.locked && (
          <Switch checked={visible} onChange={setVisible} label={t('slides.visible')} />
        )}
      </div>
    </Modal>
  )
}

/** A top tile: its cover, title, the text it opens to, and whether it shows. */
export function InfoTileModal({
  brand,
  tile,
  onClose,
}: {
  brand: Brand
  /** null for a new one. */
  tile: InfoTile | null
  onClose: () => void
}) {
  const { t, tl } = useI18n()
  const [title, setTitle] = useState(tile?.title ?? { uz: '', ru: '' })
  const [text, setText] = useState(tile?.text ?? { uz: '', ru: '' })
  const [image, setImage] = useState(tile?.image)
  const [visible, setVisible] = useState(tile?.visible ?? true)
  const [submitted, setSubmitted] = useState(false)

  const save = async () => {
    setSubmitted(true)
    if (!filled(title) || !filled(text)) return
    const next = { title, text, image, visible }
    const ok = await attempt(
      () => (tile ? tilesApi.update(brand, tile.id, next) : tilesApi.create(brand, next)),
      () => toast(t(tile ? 'toast.saved' : 'appHome.tile.created')),
    )
    if (ok) onClose()
  }
  const remove = async () => {
    if (!tile) return
    const ok = await attempt(
      () => tilesApi.remove(brand, tile.id),
      () => toast(t('appHome.tile.deleted')),
    )
    if (ok) onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={t('appHome.tiles')}
      title={tile ? tl(tile.title) : t('appHome.tile.new')}
      footer={
        <>
          {tile && (
            <Button
              size="sm"
              variant="ghost"
              className="mr-auto text-danger!"
              onClick={() => void remove()}
            >
              <Trash2 size={18} />
              {t('common.delete')}
            </Button>
          )}
          <Button size="sm" variant="ghost" className="ml-auto px-4!" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" className="px-4!" onClick={() => void save()}>
            {t(tile ? 'common.save' : 'common.add')}
          </Button>
        </>
      }
    >
      <ImageField
        label={t('appHome.tile.image')}
        hint={t('appHome.tile.image.hint')}
        preview={<TileThumb image={image} title={tl(title)} />}
        value={image}
        onChange={setImage}
      />
      <LocalizedTextField
        label={t('appHome.tile.title')}
        value={title}
        onChange={setTitle}
        requireBoth={submitted}
      />
      <LocalizedTextField
        label={t('appHome.tile.text')}
        value={text}
        onChange={setText}
        multiline
        requireBoth={submitted}
      />
      <div className="flex items-center justify-between gap-4 rounded-control bg-surface p-4">
        <div className="flex flex-col">
          <p className="font-semibold">{t('slides.visible')}</p>
          <p className="text-sm text-ink-muted">{t('appHome.visible.hint')}</p>
        </div>
        <Switch checked={visible} onChange={setVisible} label={t('slides.visible')} />
      </div>
    </Modal>
  )
}
