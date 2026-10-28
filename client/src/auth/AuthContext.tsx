import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError, tokenStorage } from '../api/client'
import type { AuthResponse, CurrentUser } from '../api/types'

interface AuthContextValue {
  user: CurrentUser | null
  loading: boolean
  login: (userNameOrEmail: string, password: string) => Promise<void>
  register: (data: { userName: string; email: string; password: string; displayName?: string }) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!tokenStorage.get()) {
      setUser(null)
      return
    }
    try {
      setUser(await api.me())
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) tokenStorage.clear()
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const handleAuth = (res: AuthResponse) => {
    tokenStorage.set(res.token)
    setUser(res.user)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (userNameOrEmail, password) => handleAuth(await api.login({ userNameOrEmail, password })),
      register: async (data) => handleAuth(await api.register(data)),
      logout: () => {
        tokenStorage.clear()
        setUser(null)
      },
      refresh,
    }),
    [user, loading, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
