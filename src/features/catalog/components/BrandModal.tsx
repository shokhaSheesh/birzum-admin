import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { brandsStore, type Brand } from '@/entities/catalog/brands'
import { useI18n } from '@/shared/i18n/useI18n'
import { newId } from '@/shared/lib/createStore'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { ImageField } from '@/shared/ui/ImageField'
import { TextField } from '@/shared/ui/TextField'
import { BrandLogo } from './BrandLogo'

type Props = {
  /** The brand to edit, or null to create one. */
  brand: Brand | null
  onClose: () => void
  onDelete: (brand: Brand) => void
}

/** Create or edit a brand: its logo and its name, which is the same in both languages. */
export function BrandModal({ brand, onClose, onDelete }: Props) {
  const { t } = useI18n()
  const [logo, setLogo] = useState(brand?.logo)
  const [name, setName] = useState(brand?.name ?? '')
  const [submitted, setSubmitted] = useState(false)

  const taken = brandsStore
    .getAll()
    .some(
      (other) => other.id !== brand?.id && other.name.toLowerCase() === name.trim().toLowerCase(),
    )
  const error = !name.trim()
    ? submitted
      ? t('error.required')
      : undefined
    : taken
      ? t('brand.error.taken')
      : undefined

  const save = () => {
    setSubmitted(true)
    if (!name.trim() || taken) return
    if (brand) {
      brandsStore.update(brand.id, { name: name.trim(), logo })
      toast(t('toast.saved'))
    } else {
      brandsStore.save({ id: newId(), name: name.trim(), logo, products: 0 })
      toast(t('brand.created'))
    }
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={t(brand ? 'common.edit' : 'nav.brands')}
      title={brand ? brand.name : t('brand.new')}
      footer={
        <>
          {brand && (
            <Button
              size="sm"
              variant="ghost"
              className="mr-auto text-danger!"
              onClick={() => onDelete(brand)}
            >
              <Trash2 size={18} />
              {t('common.delete')}
            </Button>
          )}
          <Button size="sm" variant="ghost" className="ml-auto px-4!" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" className="px-4!" onClick={save}>
            {t(brand ? 'common.save' : 'common.add')}
          </Button>
        </>
      }
    >
      <ImageField
        label={t('merchant.logo')}
        hint={t('merchant.logo.hint')}
        preview={<BrandLogo brand={{ name: name || '?', logo }} size="lg" />}
        value={logo}
        onChange={setLogo}
      />
      <TextField
        label={t('brand.name')}
        hint={t('brand.name.hint')}
        placeholder="Samsung"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={error}
        autoFocus={!brand}
      />
    </Modal>
  )
}
