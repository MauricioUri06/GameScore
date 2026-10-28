import type { ReactNode } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { Layout } from './components/Layout'
import { Spinner } from './components/Status'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import { EditProfilePage } from './pages/EditProfilePage'
import { GamePage } from './pages/GamePage'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { RankingPage } from './pages/RankingPage'
import { SearchPage } from './pages/SearchPage'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

function NotFound() {
  return (
    <div className="container page" style={{ textAlign: 'center' }}>
      <h1>404</h1>
      <p className="muted">Esta página no existe… como el Half-Life 3.</p>
      <Link to="/" className="btn btn-primary">
        Volver al inicio
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="ranking" element={<RankingPage />} />
            <Route path="games/:gameId" element={<GamePage />} />
            <Route path="u/:userName" element={<ProfilePage />} />
            <Route
              path="settings/profile"
              element={
                <RequireAuth>
                  <EditProfilePage />
                </RequireAuth>
              }
            />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
