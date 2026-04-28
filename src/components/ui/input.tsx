import { ChevronDown } from 'lucide-react'
import { type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

const inputBase =
  'focus-ring flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50'

export function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-foreground">
      <span className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive" aria-hidden>*</span>}
      </span>
      {children}
      {hint && !error && <span className="text-xs text-muted-foreground">{hint}</span>}
      {error && <span className="text-xs font-medium text-destructive">{error}</span>}
    </label>
  )
}

/** Wraps an Input or Select with optional leading/trailing icon slots */
export function InputGroup({
  children,
  leading,
  trailing,
}: {
  children: ReactNode
  leading?: ReactNode
  trailing?: ReactNode
}) {
  return (
    <div className="relative">
      {leading && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground [&_svg]:size-4">
          {leading}
        </div>
      )}
      <div className={cn(leading && '[&_input]:pl-9 [&_select]:pl-9', trailing && '[&_input]:pr-9 [&_select]:pr-9')}>
        {children}
      </div>
      {trailing && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground [&_svg]:size-4">
          {trailing}
        </div>
      )}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(inputBase, 'h-9', className)} {...props} />
  ),
)
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(inputBase, 'min-h-24 resize-none', className)} {...props} />
  ),
)
Textarea.displayName = 'Textarea'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select ref={ref} className={cn(inputBase, 'h-9 appearance-none pr-8', className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </div>
  ),
)
Select.displayName = 'Select'
