import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'
import { easeOutExpo } from '../lib/theme'

/** Animates from the previous value to `value`. Shows the final value immediately under reduced motion. */
export function useCountUp(value, duration = 1.2) {
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(0)
  const from = useRef(0)

  useEffect(() => {
    if (value == null) return
    if (reduce) {
      from.current = value
      setDisplay(value)
      return
    }
    const controls = animate(from.current, value, {
      duration,
      ease: easeOutExpo,
      onUpdate: (v) => {
        from.current = v
        setDisplay(v)
      },
    })
    return () => controls.stop()
  }, [value, duration, reduce])

  return display
}
