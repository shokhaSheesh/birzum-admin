import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { logAction } from '@/entities/audit/audit'
import { slidesStore, type AppId, type Slide } from '@/entities/onboarding/slides'
import { useI18n } from '@/shared/i18n/useI18n'
import { newId } from '@/shared/lib/createStore'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ImageField } from '@/shared/ui/ImageField'
import { LocalizedTextField } from '@/shared/ui/LocalizedTextField'
import { Modal } from '@/shared/ui/Modal'
import { Switch } from '@/shared/ui/Switch'
import { SlideThumb } from './SlideThumb'

type Props = {
  app: AppId
  /** The slide to edit, or null to add one at the end. */
  slide: Slide | null
  onClose: () => void
  onDelete: (slide: Slide) => void
}

const filled = (text: { uz: string; ru: string }) => !!text.uz.trim() && !!text.ru.trim()

/** Add or edit one slide: its picture, title and line in both languages, and whether it shows. */
export function SlideModal({ app, slide, onClose, onDelete }: Props) {
  const { t, tl } = useI18n()
  const [image, setImage] = useState(slide?.image)
  const [title, setTitle] = useState(slide?.title ?? { uz: '', ru: '' })
  const [text, setText] = useState(slide?.text ?? { uz: '', ru: '' })
  const [visible, setVisible] = useState(slide?.visible ?? true)
  const [submitted, setSubmitted] = useState(false)
  // Only the slides the app ships with can do without an uploaded picture
  const imageMissing = !image && !slide?.builtIn

  const save = () => {
    setSubmitted(true)
    if (imageMissing || !filled(title) || !filled(text)) return
    const clean = (v: { uz: string; ru: string }) => ({ uz: v.uz.trim(), ru: v.ru.trim() })
    const record = { image, title: clean(title), text: clean(text), visible }
    if (slide) slidesStore.update(slide.id, record)
    else slidesStore.replaceAll([...slidesStore.getAll(), { id: newId(), app, ...record }])
    logAction({
      section: 'onboarding',
      kind: slide ? 'update' : 'create',
      action: slide ? 'audit.a.slideSaved' : 'audit.a.slideCreated',
      target: tl(record.title),
    })
    toast(t(slide ? 'toast.saved' : 'slides.created'))
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={t(`slides.app.${app}`)}
      title={slide ? tl(slide.title) : t('slides.new')}
      footer={
        <>
          {slide && (
            <Button
              size="sm"
              variant="ghost"
              className="mr-auto text-danger!"
              onClick={() => onDelete(slide)}
            >
              <Trash2 size={18} />
              {t('common.delete')}
            </Button>
          )}
          <Button size="sm" variant="ghost" className="ml-auto px-4!" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" className="px-4!" onClick={save}>
            {t(slide ? 'common.save' : 'common.add')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
        <ImageField
          label={t('slides.image')}
          hint={t(slide?.builtIn ? 'slides.image.hintBuiltIn' : 'slides.image.hint')}
          preview={<SlideThumb slide={{ image, builtIn: slide?.builtIn }} className="w-40!" />}
          value={image}
          onChange={setImage}
        />
        {submitted && imageMissing && (
          <p className="text-sm text-danger">{t('slides.image.required')}</p>
        )}
      </div>
      <LocalizedTextField
        label={t('slides.title')}
        value={title}
        onChange={setTitle}
        requireBoth={submitted}
      />
      <LocalizedTextField
        label={t('slides.text')}
        value={text}
        onChange={setText}
        multiline
        requireBoth={submitted}
      />
      <div className="flex items-center justify-between gap-4 rounded-control bg-surface p-4">
        <div className="flex flex-col">
          <p className="font-semibold">{t('slides.visible')}</p>
          <p className="text-sm text-ink-muted">{t('slides.visible.hint')}</p>
        </div>
        <Switch checked={visible} onChange={setVisible} label={t('slides.visible')} />
      </div>
    </Modal>
  )
}
