import { useId } from 'react'
import { cn } from '@/shared/lib/cn'
import { controlClass } from './control'
import { Field } from './Field'
import { Listbox, SelectChevron, type ListOption } from './Listbox'

type Props<T extends string> = {
  label: string
  options: ListOption<T>[]
  value: T
  onChange: (value: T) => void
  hint?: string
  error?: string
  disabled?: boolean
}

/** Pick one of many options in a form: the same box as a text field, opening our list. */
export function SelectField<T extends string>({
  label,
  options,
  value,
  onChange,
  hint,
  error,
  disabled,
}: Props<T>) {
  const id = useId()

  return (
    <Field label={label} htmlFor={id} hint={hint} error={error}>
      <Listbox
        id={id}
        options={options}
        value={value}
        onChange={onChange}
        disabled={disabled}
        triggerClassName={cn(
          controlClass(!!error),
          'justify-between disabled:cursor-default disabled:bg-surface disabled:text-ink-muted',
        )}
        trigger={({ open, selected }) => (
          <>
            <span className="min-w-0 truncate">{selected?.label}</span>
            <SelectChevron open={open} />
          </>
        )}
      />
    </Field>
  )
}
