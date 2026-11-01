import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ActivitiesMenu } from './ActivitiesMenu'
import { UserMenu } from './UserMenu'
import { SearchAutocomplete } from './SearchAutocomplete'
import { useLang } from '../i18n/LanguageContext'
import { LanguageSwitcher } from '../i18n/LanguageSwitcher'

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
  const { t } = useLang()
  const navigate = useNavigate()
  return (
    <SearchAutocomplete
      className="nav-search"
      placeholder={t('Buscar juegos o usuarios…', 'Search games or users…')}
      onSearch={(q) => q.length >= 2 && navigate(`/juegos?q=${encodeURIComponent(q)}`)}
    />
  )
}

export function Layout() {
  const { t } = useLang()
  const { user } = useAuth()

  return (
    <>
      <header className="navbar">
        <div className="container navbar-inner">
          <LanguageSwitcher />
          <Link to="/" className="brand">
            <Logo />
            <span>
              Game<em>Score</em>
            </span>
          </Link>
          <nav className="nav-links">
            <NavLink to="/" end>
              {t('Inicio', 'Home')}
            </NavLink>
            <NavLink to="/ranking">Ranking</NavLink>
            <NavLink to="/juegos">{t('Juegos', 'Games')}</NavLink>
            <ActivitiesMenu />
          </nav>
          <NavSearch />
          <div className="nav-user">
            {user ? (
              <UserMenu />
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">
                  {t('Entrar', 'Log in')}
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  {t('Crear cuenta', 'Sign up')}
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
          <span>
            {t('GameScore — califica, rankea y comparte tus juegos.', 'GameScore — rate, rank and share your games.')}
          </span>
          <span>
            {t('Datos de juegos por', 'Game data by')}{' '}
            <a href="https://www.igdb.com" target="_blank" rel="noreferrer">
              IGDB
            </a>
          </span>
        </div>
      </footer>
    </>
  )
}
