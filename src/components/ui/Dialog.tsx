import clsx from 'clsx'
import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  width?: 'sm' | 'md'
}

/** Модальное окно на нативном <dialog>: фокус, Esc и доступность из коробки. */
export function Modal({ open, onClose, title, description, children, footer, width = 'sm' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className={clsx(
        'm-auto w-[calc(100vw-32px)] rounded-lg border border-line bg-surface p-0 text-ink shadow-[0_16px_48px_rgb(16_24_32/0.18)] open:animate-fade-in',
        width === 'sm' ? 'max-w-[420px]' : 'max-w-[560px]',
      )}
    >
      {open && (
        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-4 px-5 pt-4">
            <div className="space-y-1">
              <h2 id={titleId} className="text-[15px] font-semibold">
                {title}
              </h2>
              {description && <div className="text-13 text-muted">{description}</div>}
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Закрыть">
              <X />
            </Button>
          </div>
          {children && <div className="px-5 pt-4">{children}</div>}
          {footer && <div className="mt-5 flex justify-end gap-2 border-t border-line bg-subtle/60 px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel: string
  tone?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, description, confirmLabel, tone = 'default', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Отмена
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} autoFocus>
            {confirmLabel}
          </Button>
        </>
      }
    />
  )
}

interface NameDialogProps {
  open: boolean
  title: string
  submitLabel: string
  initialName: string
  initialDescription?: string
  onSubmit: (values: { name: string; description: string }) => void
  onCancel: () => void
}

/** Диалог ввода названия и описания сценария (с проверкой обязательного поля). */
export function NameDialog({ open, title, submitLabel, initialName, initialDescription = '', onSubmit, onCancel }: NameDialogProps) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [error, setError] = useState<string | null>(null)
  const nameId = useId()
  const descId = useId()

  useEffect(() => {
    if (open) {
      setName(initialName)
      setDescription(initialDescription)
      setError(null)
    }
  }, [open, initialName, initialDescription])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Укажите название сценария')
      return
    }
    if (name.trim().length > 60) {
      setError('Не более 60 символов')
      return
    }
    onSubmit({ name: name.trim(), description: description.trim() })
  }

  return (
    <Modal open={open} onClose={onCancel} title={title} width="sm">
      <form onSubmit={submit} className="space-y-3" noValidate>
        <div className="space-y-1">
          <label htmlFor={nameId} className="text-xs font-medium text-ink-2">
            Название
          </label>
          <input
            id={nameId}
            autoFocus
            value={name}
            maxLength={80}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
            aria-invalid={!!error}
            aria-describedby={error ? `${nameId}-err` : undefined}
            className={clsx(
              'h-8 w-full rounded-md border bg-surface px-2.5 text-13 outline-none focus:border-accent focus:ring-2 focus:ring-accent-line',
              error ? 'border-crit' : 'border-line-strong',
            )}
          />
          {error && (
            <p id={`${nameId}-err`} className="text-xs text-crit">
              {error}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor={descId} className="text-xs font-medium text-ink-2">
            Описание <span className="font-normal text-faint">— необязательно</span>
          </label>
          <textarea
            id={descId}
            value={description}
            rows={2}
            maxLength={240}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-none rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-13 outline-none focus:border-accent focus:ring-2 focus:ring-accent-line"
          />
        </div>
        <div className="-mx-5 mt-5 flex justify-end gap-2 border-t border-line bg-subtle/60 px-5 py-3">
          <Button variant="secondary" onClick={onCancel}>
            Отмена
          </Button>
          <Button variant="primary" type="submit">
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
