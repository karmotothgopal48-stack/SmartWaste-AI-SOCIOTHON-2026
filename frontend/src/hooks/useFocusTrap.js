import { useEffect, useRef } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * While `active`: locks page scroll, moves focus into `ref` (to `[data-autofocus]` if present),
 * keeps Tab / Shift+Tab inside, calls `onEscape` on Escape, and restores focus on deactivate.
 */
export function useFocusTrap(ref, active, { onEscape } = {}) {
  const escape = useRef(onEscape)
  escape.current = onEscape

  useEffect(() => {
    if (!active) return
    const restore = document.activeElement
    document.body.style.overflow = 'hidden'

    const timer = setTimeout(() => {
      const target = ref.current?.querySelector('[data-autofocus]') ?? ref.current
      target?.focus()
    }, 50)

    const onKey = (e) => {
      if (e.key === 'Escape') {
        escape.current?.()
        return
      }
      if (e.key !== 'Tab' || !ref.current) return
      const nodes = [...ref.current.querySelectorAll(FOCUSABLE)].filter((n) => n.getClientRects().length)
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const outside = !ref.current.contains(document.activeElement)
      if (e.shiftKey && (document.activeElement === first || outside)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (document.activeElement === last || outside)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      restore?.focus?.()
    }
  }, [active, ref])
}
