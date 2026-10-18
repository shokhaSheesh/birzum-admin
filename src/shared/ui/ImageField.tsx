import { ImageUp, Trash2 } from 'lucide-react'
import { useRef, type ReactNode } from 'react'
import { useI18n } from '@/shared/i18n/useI18n'
import { Button } from './Button'

type Props = {
  label: string
  /** What file works best, e.g. "Kvadrat PNG yoki JPG, kamida 400×400." */
  hint: string
  /** The current picture, or a stand-in when there is none. */
  preview: ReactNode
  value?: string
  onChange: (url: string | undefined) => void
  /** Beside the label, e.g. a UZ / RU toggle for a picture per language. */
  labelEnd?: ReactNode
}

/** One picture of a record (a logo, a category image): a preview, then upload and remove. */
export function ImageField({ label, hint, preview, value, onChange, labelEnd }: Props) {
  const { t } = useI18n()
  const input = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-5">
      {preview}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-ink-muted">{label}</p>
          {labelEnd}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => input.current?.click()}>
            <ImageUp size={18} />
            {t(value ? 'image.replace' : 'image.upload')}
          </Button>
          {value && (
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
        <p className="text-sm text-ink-subtle">{hint}</p>
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
