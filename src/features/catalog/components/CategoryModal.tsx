import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { categoriesStore, childrenOf, rootsOf, type Category } from '@/entities/catalog/categories'
import type { Lang } from '@/shared/i18n/dictionaries'
import { useI18n } from '@/shared/i18n/useI18n'
import { newId } from '@/shared/lib/createStore'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ImageField } from '@/shared/ui/ImageField'
import { Modal } from '@/shared/ui/Modal'
import { SelectField } from '@/shared/ui/SelectField'
import { Switch } from '@/shared/ui/Switch'
import { TextField } from '@/shared/ui/TextField'
import { CategoryThumb } from './CategoryThumb'
import { logAction } from '@/entities/audit/audit'

type Props = {
  /** The category to edit, or null to create one. */
  category: Category | null
  /** For a new subcategory: the category it goes under. */
  parentId?: string
  onClose: () => void
  onDelete: (category: Category) => void
}

/**
 * Create or edit a category or subcategory: where it sits, its picture, its name in both
 * languages, and whether shoppers see it.
 */
export function CategoryModal({ category, parentId: presetParent, onClose, onDelete }: Props) {
  const { t, tl } = useI18n()
  const all = categoriesStore.useAll()
  const [parentId, setParentId] = useState(category?.parentId ?? presetParent ?? '')
  // A category that has subcategories cannot itself become one: only one level deep
  const hasChildren = !!category && childrenOf(all, category.id).length > 0
  const [image, setImage] = useState(category?.image)
  const [name, setName] = useState(category?.name ?? { uz: '', ru: '' })
  const [visible, setVisible] = useState(category?.visible ?? true)
  const [submitted, setSubmitted] = useState(false)

  // Names only need to differ among siblings: two parents may each have "Aksessuarlar"
  const taken = (lang: Lang) =>
    all.some(
      (other) =>
        other.id !== category?.id &&
        (other.parentId ?? '') === parentId &&
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
      parentId: parentId || undefined,
      name: { uz: name.uz.trim(), ru: name.ru.trim() },
      image,
      visible,
    }
    if (category) {
      categoriesStore.update(category.id, record)
      toast(t('toast.saved'))
      logAction({
        section: 'categories',
        kind: 'update',
        action: 'audit.a.categorySaved',
        target: tl(record.name),
      })
    } else {
      // A new category goes to the end of the list
      categoriesStore.replaceAll([...all, { id: newId(), products: 0, ...record }])
      toast(t(parentId ? 'subcategory.created' : 'category.created'))
      logAction({
        section: 'categories',
        kind: 'create',
        action: 'audit.a.categoryCreated',
        target: tl(record.name),
      })
    }
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={t(category ? 'common.edit' : 'nav.categories')}
      title={category ? tl(category.name) : t(parentId ? 'subcategory.new' : 'category.new')}
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
      <SelectField
        label={t('category.parent')}
        options={[
          { value: '', label: t('category.parent.none') },
          ...rootsOf(all)
            .filter((root) => root.id !== category?.id)
            .map((root) => ({ value: root.id, label: tl(root.name) })),
        ]}
        value={parentId}
        onChange={setParentId}
        disabled={hasChildren}
        hint={t(hasChildren ? 'category.parent.locked' : 'category.parent.hint')}
      />
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
    </Modal>
  )
}
