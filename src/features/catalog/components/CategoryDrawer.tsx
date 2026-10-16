import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { categoriesStore, type Category } from '@/entities/catalog/categories'
import type { Lang } from '@/shared/i18n/dictionaries'
import { useI18n } from '@/shared/i18n/useI18n'
import { newId } from '@/shared/lib/createStore'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { Drawer } from '@/shared/ui/Drawer'
import { ImageField } from '@/shared/ui/ImageField'
import { Switch } from '@/shared/ui/Switch'
import { TextField } from '@/shared/ui/TextField'
import { CategoryThumb } from './CategoryThumb'

type Props = {
  /** The category to edit, or null to create one. */
  category: Category | null
  onClose: () => void
  onDelete: (category: Category) => void
}

/** Create or edit a category: its picture, its name in both languages, and whether shoppers see it. */
export function CategoryDrawer({ category, onClose, onDelete }: Props) {
  const { t, tl } = useI18n()
  const [image, setImage] = useState(category?.image)
  const [name, setName] = useState(category?.name ?? { uz: '', ru: '' })
  const [visible, setVisible] = useState(category?.visible ?? true)
  const [submitted, setSubmitted] = useState(false)

  const taken = (lang: Lang) =>
    categoriesStore
      .getAll()
      .some(
        (other) =>
          other.id !== category?.id &&
          other.name[lang].trim().toLowerCase() === name[lang].trim().toLowerCase(),
      )
  const errorOf = (lang: Lang) => {
    if (!name[lang].trim()) return submitted ? t('error.required') : undefined
    if (taken(lang)) return t('category.error.taken')
  }

  const save = () => {
    setSubmitted(true)
    if (!name.uz.trim() || !name.ru.trim() || taken('uz') || taken('ru')) return
    const record = {
      name: { uz: name.uz.trim(), ru: name.ru.trim() },
      image,
      visible,
    }
    if (category) {
      categoriesStore.update(category.id, record)
      toast(t('toast.saved'))
    } else {
      // A new category goes to the end of the list
      categoriesStore.replaceAll([
        ...categoriesStore.getAll(),
        { id: newId(), products: 0, ...record },
      ])
      toast(t('category.created'))
    }
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      eyebrow={t(category ? 'common.edit' : 'nav.categories')}
      title={category ? tl(category.name) : t('category.new')}
      footer={
        <>
          {category && (
            <Button
              size="sm"
              variant="ghost"
              className="mr-auto text-danger!"
              onClick={() => onDelete(category)}
            >
              <Trash2 size={18} />
              {t('common.delete')}
            </Button>
          )}
          <Button size="sm" variant="ghost" className="ml-auto px-4!" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" className="px-4!" onClick={save}>
            {t(category ? 'common.save' : 'common.add')}
          </Button>
        </>
      }
    >
      <ImageField
        label={t('category.image')}
        hint={t('category.image.hint')}
        preview={<CategoryThumb image={image} size="lg" />}
        value={image}
        onChange={setImage}
      />
      <TextField
        label={t('category.name.uz')}
        value={name.uz}
        onChange={(e) => setName({ ...name, uz: e.target.value })}
        error={errorOf('uz')}
        autoFocus={!category}
      />
      <TextField
        label={t('category.name.ru')}
        value={name.ru}
        onChange={(e) => setName({ ...name, ru: e.target.value })}
        error={errorOf('ru')}
      />
      <div className="flex items-center justify-between gap-4 rounded-control bg-surface p-4">
        <div className="flex flex-col">
          <p className="font-semibold">{t('category.visible')}</p>
          <p className="text-sm text-ink-muted">{t('category.visible.hint')}</p>
        </div>
        <Switch checked={visible} onChange={setVisible} label={t('category.visible')} />
      </div>
    </Drawer>
  )
}
