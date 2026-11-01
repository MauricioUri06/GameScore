import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLang } from '../i18n/LanguageContext'

const ACTIVITIES = [
  {
    to: '/older-newer',
    icon: '⏳',
    name: ['Older/Newer', 'Older/Newer'],
    description: ['¿Salió antes o después?', 'Released before or after?'],
  },
  {
    to: '/adivina-la-portada',
    icon: '🖼️',
    name: ['Adivina la portada', 'Guess the Cover'],
    description: ['Portadas borrosas', 'Blurry covers'],
  },
  {
    to: '/categorias',
    icon: '📚',
    name: ['Categorías', 'Categories'],
    description: ['Un juego de cada categoría, rápido', 'A game for each category, fast'],
  },
] as const

/** Botón "Actividades" de la barra de arriba, con un menú desplegable de minijuegos. */
export function ActivitiesMenu() {
  const [open, setOpen] = useState(false)
  const { t } = useLang()
  const ref = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const active = ACTIVITIES.some((a) => location.pathname.startsWith(a.to))

  useEffect(() => setOpen(false), [location.pathname])
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="activities-menu" ref={ref}>
      <button
        type="button"
        className={`activities-trigger${active ? ' active' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {t('Actividades', 'Activities')} <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="activities-panel" role="menu">
          {ACTIVITIES.map((a) => (
            <Link key={a.to} role="menuitem" to={a.to}>
              <span className="activities-icon" aria-hidden="true">
                {a.icon}
              </span>
              <span>
                <strong>{t(a.name[0], a.name[1])}</strong>
                <small>{t(a.description[0], a.description[1])}</small>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
