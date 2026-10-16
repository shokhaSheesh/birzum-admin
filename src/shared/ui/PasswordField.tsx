import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '@/shared/i18n/useI18n'
import { TextField, type TextFieldProps } from './TextField'

export function PasswordField(props: Omit<TextFieldProps, 'type' | 'trailing'>) {
  const { t } = useI18n()
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeOff : Eye

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={t(visible ? 'password.hide' : 'password.show')}
          className="-mr-2 grid size-10 place-items-center rounded-full text-ink-subtle active:bg-surface"
        >
          <Icon size={20} />
        </button>
      }
    />
  )
}
