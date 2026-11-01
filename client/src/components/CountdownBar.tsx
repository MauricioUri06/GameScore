import { useEffect, useRef, useState } from 'react'
import { useLang } from '../i18n/LanguageContext'

/**
 * Barra de tiempo que se vacía. Se reinicia cuando cambia `resetKey` y llama a `onExpire` una sola vez
 * al llegar a cero. Con `running = false` se congela (por ejemplo, mientras se revela la respuesta).
 */
export function CountdownBar({
  seconds,
  resetKey,
  running,
  onExpire,
}: {
  seconds: number
  resetKey: string | number
  running: boolean
  onExpire: () => void
}) {
  const [left, setLeft] = useState(seconds)
  const { t } = useLang()
  const deadline = useRef(0)
  const expired = useRef(false)
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onExpireRef.current = onExpire
  })

  // Nueva pregunta: tiempo completo
  useEffect(() => {
    deadline.current = Date.now() + seconds * 1000
    expired.current = false
    setLeft(seconds)
  }, [resetKey, seconds])

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      const remaining = Math.max(0, (deadline.current - Date.now()) / 1000)
      setLeft(remaining)
      if (remaining <= 0 && !expired.current) {
        expired.current = true
        onExpireRef.current()
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [running, resetKey])

  const share = Math.max(0, Math.min(1, left / seconds))
  const level = share > 0.5 ? 'ok' : share > 0.25 ? 'warn' : 'danger'

  return (
    <div className="countdown" role="timer" aria-label={t(`${Math.ceil(left)} segundos`, `${Math.ceil(left)} seconds`)}>
      <div className="countdown-track">
        <span className={`countdown-fill ${level}`} style={{ width: `${share * 100}%` }} />
      </div>
      <span className={`countdown-text ${level}`}>{Math.ceil(left)} s</span>
    </div>
  )
}
