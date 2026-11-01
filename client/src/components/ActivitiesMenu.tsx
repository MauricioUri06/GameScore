import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const ACTIVITIES = [
  { to: '/older-newer', icon: '⏳', name: 'Older/Newer', description: '¿Salió antes o después?' },
  { to: '/adivina-la-portada', icon: '🖼️', name: 'Adivina la portada', description: 'Portadas borrosas' },
  { to: '/categorias', icon: '📚', name: 'Categorías', description: 'Un juego de cada categoría, rápido' },
]

/** Botón "Actividades" de la barra de arriba, con un menú desplegable de minijuegos. */
export function ActivitiesMenu() {
  const [open, setOpen] = useState(false)
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
        Actividades <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="activities-panel" role="menu">
          {ACTIVITIES.map((a) => (
            <Link key={a.to} role="menuitem" to={a.to}>
              <span className="activities-icon" aria-hidden="true">
                {a.icon}
              </span>
              <span>
                <strong>{a.name}</strong>
                <small>{a.description}</small>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
