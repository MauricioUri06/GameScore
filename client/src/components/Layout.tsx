import { useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Avatar } from './Avatar'

function Logo() {
  return (
    <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="4" fill="#16231e" />
      <path
        d="M32 12l5.9 12.6 13.8 1.7-10.2 9.5 2.7 13.7L32 42.7l-12.2 6.8 2.7-13.7-10.2-9.5 13.8-1.7z"
        fill="#2fa37a"
      />
    </svg>
  )
}

function NavSearch() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (q.trim().length >= 2) navigate(`/juegos?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <form className="nav-search" onSubmit={submit} role="search">
      <input
        className="input"
        type="search"
        placeholder="Buscar juegos…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Buscar juegos"
      />
    </form>
  )
}

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <>
      <header className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="brand">
            <Logo />
            <span>
              Game<em>Score</em>
            </span>
          </Link>
          <nav className="nav-links">
            <NavLink to="/" end>
              Ranking
            </NavLink>
            <NavLink to="/juegos">Juegos</NavLink>
          </nav>
          <NavSearch />
          <div className="nav-user">
            {user ? (
              <>
                <Link to={`/u/${user.userName}`} className="row" style={{ gap: 8 }}>
                  <Avatar name={user.userName} />
                </Link>
                <button className="btn btn-ghost btn-sm" onClick={logout}>
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">
                  Entrar
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container">
          <span>GameScore — califica, rankea y comparte tus juegos.</span>
          <span>
            Datos de juegos por{' '}
            <a href="https://www.igdb.com" target="_blank" rel="noreferrer">
              IGDB
            </a>
          </span>
        </div>
      </footer>
    </>
  )
}
