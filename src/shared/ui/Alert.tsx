import { CircleAlert } from 'lucide-react'

/** An error that belongs to the whole form, not one field. */
export function Alert({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex items-center gap-2.5 rounded-control bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
    >
      <CircleAlert size={20} className="shrink-0" />
      {message}
    </p>
  )
}
