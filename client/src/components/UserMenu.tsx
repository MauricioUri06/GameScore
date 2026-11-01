import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Avatar } from './Avatar'

/** Menú desplegable del usuario (arriba a la derecha): perfil, medallas, admin y cerrar sesión. */
export function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const location = useLocation()

  // Se cierra al navegar, al hacer clic fuera o con Esc
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

  if (!user) return null

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar name={user.userName} url={user.avatarUrl} />
        <span className="user-menu-name">{user.userName}</span>
        <span className="user-menu-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="user-menu-panel" role="menu">
          <Link role="menuitem" to={`/u/${user.userName}`}>
            Mi perfil
          </Link>
          <Link role="menuitem" to="/settings/profile">
            Editar perfil
          </Link>
          <Link role="menuitem" to={`/u/${user.userName}/medallas`}>
            Medallas
          </Link>
          {user.isAdmin && (
            <Link role="menuitem" to="/admin">
              Panel de administrador
            </Link>
          )}
          <hr />
          <button
            type="button"
            role="menuitem"
            className="user-menu-logout"
            onClick={() => {
              setOpen(false)
              logout()
            }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
