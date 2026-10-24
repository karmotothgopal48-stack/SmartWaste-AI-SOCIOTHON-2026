import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary:
    'bg-primary text-bg font-semibold hover:bg-primary-hover hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] disabled:hover:bg-primary disabled:hover:shadow-none',
  secondary: 'border border-strong text-ink hover:bg-surface-2 hover:border-white/20',
  danger: 'border border-danger/30 bg-danger/10 text-danger hover:bg-danger/15',
  'danger-solid': 'bg-danger text-white font-semibold hover:bg-danger-hover hover:shadow-[0_0_20px_rgba(239,68,68,0.35)]',
  ghost: 'text-ink-muted hover:bg-white/5 hover:text-ink',
}

/** Shared button look, so links (e.g. react-router <Link>) can be styled as buttons. */
export const buttonClass = (variant = 'primary', size = 'md') =>
  `inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] text-small font-medium transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${
    size === 'sm' ? 'h-9 px-3' : 'h-10 px-4'
  } ${VARIANTS[variant]}`

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${buttonClass(variant, size)} ${className}`}
      {...props}
    >
      {loading ? <Loader2 size={15} strokeWidth={2} className="animate-spin" /> : Icon && <Icon size={15} strokeWidth={2} />}
      {children}
    </button>
  )
}

export function IconButton({ icon: Icon, label, tone = 'default', className = '', ...props }) {
  const tones = {
    default: 'text-ink-muted hover:bg-white/5 hover:text-ink',
    primary: 'text-ink-muted hover:bg-primary/10 hover:text-primary',
    danger: 'text-ink-muted hover:bg-danger/10 hover:text-danger',
  }
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-[10px] transition active:scale-95 ${tones[tone]} ${className}`}
      {...props}
    >
      <Icon size={16} strokeWidth={1.75} />
    </button>
  )
}
