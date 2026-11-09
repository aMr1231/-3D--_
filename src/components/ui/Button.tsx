import clsx from 'clsx'
import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { Link, type LinkProps } from 'react-router'
import { Loader } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'icon' | 'icon-sm'

const base =
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-colors duration-150 select-none disabled:opacity-50 disabled:pointer-events-none [&_svg]:shrink-0'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover shadow-[inset_0_-1px_0_rgb(0_0_0/0.12)]',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-subtle hover:border-[#c4cad1]',
  ghost: 'text-ink-2 hover:bg-subtle hover:text-ink',
  quiet: 'text-accent hover:text-accent-hover hover:bg-accent-soft',
  danger: 'bg-surface text-crit border border-line-strong hover:bg-crit-soft hover:border-crit/40',
}

const sizes: Record<ButtonSize, string> = {
  xs: 'h-6 px-2 text-xs rounded-[4px] [&_svg]:size-3.5',
  sm: 'h-7 px-2.5 text-13 rounded-[5px] [&_svg]:size-3.5',
  md: 'h-8 px-3 text-13 rounded-md [&_svg]:size-4',
  icon: 'size-8 rounded-md [&_svg]:size-4',
  'icon-sm': 'size-7 rounded-[5px] [&_svg]:size-3.5',
}

export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', className?: string) {
  return clsx(base, variants[variant], sizes[size], className)
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  ref?: Ref<HTMLButtonElement>
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader className="animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
}

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
}

export function ButtonLink({ variant = 'secondary', size = 'md', icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, size, typeof className === 'string' ? className : undefined)} {...rest}>
      {icon}
      {children}
    </Link>
  )
}
