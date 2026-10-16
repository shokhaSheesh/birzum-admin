import { ImageUp, Trash2 } from 'lucide-react'
import { useRef } from 'react'
import { MerchantLogo } from '@/entities/merchants/ui/MerchantLogo'
import { useI18n } from '@/shared/i18n/useI18n'
import { Button } from '@/shared/ui/Button'

type Props = {
  name: string
  logo?: string
  onChange: (logo: string | undefined) => void
}

/** The shop's square logo: a preview, then upload and remove, and what file works best. */
export function LogoField({ name, logo, onChange }: Props) {
  const { t } = useI18n()
  const input = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-5">
      <MerchantLogo merchant={{ name: name || '?', logo }} size="lg" />
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-ink-muted">{t('merchant.logo')}</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => input.current?.click()}>
            <ImageUp size={18} />
            {t(logo ? 'merchant.logo.replace' : 'merchant.logo.upload')}
          </Button>
          {logo && (
            <Button
              size="sm"
              variant="ghost"
              className="text-danger!"
              onClick={() => onChange(undefined)}
            >
              <Trash2 size={18} />
              {t('common.remove')}
            </Button>
          )}
        </div>
        <p className="text-sm text-ink-subtle">{t('merchant.logo.hint')}</p>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onChange(URL.createObjectURL(file))
          e.target.value = ''
        }}
      />
    </div>
  )
}
