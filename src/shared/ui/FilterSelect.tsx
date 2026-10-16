import { cn } from '@/shared/lib/cn'
import { Listbox, SelectChevron, type ListOption } from './Listbox'

type Props<T extends string> = {
  /** Read by screen readers, e.g. "Merchant". */
  label: string
  /** The first option is "all", the unfiltered state. */
  options: ListOption<T>[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
}

/**
 * Filters a table by one value. While a value other than the first ("all") is chosen, the button
 * is outlined in navy so it is plain what the table is filtered by.
 */
export function FilterSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: Props<T>) {
  const set = value !== options[0]?.value
  return (
    <Listbox
      options={options}
      value={value}
      onChange={onChange}
      ariaLabel={label}
      disabled={disabled}
      fit
      triggerClassName={cn(
        'flex h-10 items-center gap-2 rounded-control border bg-canvas pr-2.5 pl-3 text-sm whitespace-nowrap transition-colors disabled:cursor-default disabled:opacity-45',
        set
          ? 'border-primary font-semibold text-ink'
          : 'border-line text-ink hover:border-navy-400',
      )}
      trigger={({ open, selected }) => (
        <>
          {selected?.label ?? label}
          <SelectChevron open={open} />
        </>
      )}
    />
  )
}
