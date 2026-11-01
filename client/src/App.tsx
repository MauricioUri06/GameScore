import type { ReactNode } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { Layout } from './components/Layout'
import { Spinner } from './components/Status'
import { AdminPage } from './pages/AdminPage'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import { CategoryGamePage } from './pages/CategoryGamePage'
import { CoverQuizPage } from './pages/CoverQuizPage'
import { EditProfilePage } from './pages/EditProfilePage'
import { FinishedPage } from './pages/FinishedPage'
import { GamePage } from './pages/GamePage'
import { GamesPage } from './pages/GamesPage'
import { HomePage } from './pages/HomePage'
import { MedalsPage } from './pages/MedalsPage'
import { OlderNewerPage } from './pages/OlderNewerPage'
import { ProfilePage } from './pages/ProfilePage'
import { RankingPage } from './pages/RankingPage'
import { LanguageProvider, useLang } from './i18n/LanguageContext'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!user.isAdmin) return <NotFound />
  return children
}

function NotFound() {
  const { t } = useLang()
  return (
    <div className="container page" style={{ textAlign: 'center' }}>
      <h1>404</h1>
      <p className="muted">
        {t('Esta página no existe… como el Half-Life 3.', "This page doesn't exist… just like Half-Life 3.")}
      </p>
      <Link to="/" className="btn btn-primary">
        {t('Volver al inicio', 'Back to home')}
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="ranking" element={<RankingPage />} />
              <Route path="juegos" element={<GamesPage />} />
              <Route path="older-newer" element={<OlderNewerPage />} />
              <Route path="adivina-la-portada" element={<CoverQuizPage />} />
              <Route path="categorias" element={<CategoryGamePage />} />
              {/* Ruta vieja */}
              <Route path="search" element={<Navigate to="/juegos" replace />} />
              <Route path="games/:gameId" element={<GamePage />} />
              <Route path="u/:userName" element={<ProfilePage />} />
              <Route path="u/:userName/medallas" element={<MedalsPage />} />
              <Route path="u/:userName/terminados" element={<FinishedPage />} />
              <Route
                path="settings/profile"
                element={
                  <RequireAuth>
                    <EditProfilePage />
                  </RequireAuth>
                }
              />
              <Route
                path="admin"
                element={
                  <RequireAdmin>
                    <AdminPage />
                  </RequireAdmin>
                }
              />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}
