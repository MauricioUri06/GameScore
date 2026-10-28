import type {
  Activity,
  AuthResponse,
  CurrentUser,
  GameDetail,
  GameSummary,
  Genre,
  MyRating,
  Profile,
  RankedGame,
} from './types'

const TOKEN_KEY = 'gamescore.token'

export const tokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* almacenamiento no disponible */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* almacenamiento no disponible */
    }
  },
}

/** Error de la API con un mensaje legible para mostrar en pantalla. */
export class ApiError extends Error {
  status: number
  fieldErrors: Record<string, string[]>

  constructor(status: number, message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const token = tokenStorage.get()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`/api${path}`, { ...options, headers })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. ¿Está corriendo la API?')
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  const data = text ? safeJson(text) : undefined

  if (!response.ok) {
    const problem = (data ?? {}) as { title?: string; detail?: string; errors?: Record<string, string[]> }
    const fieldErrors = problem.errors ?? {}
    const firstFieldError = Object.values(fieldErrors).flat()[0]
    const message =
      firstFieldError ??
      problem.detail ??
      problem.title ??
      (response.status === 401 ? 'Necesitas iniciar sesión.' : `Error ${response.status}`)
    throw new ApiError(response.status, message, fieldErrors)
  }

  return data as T
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

const json = (body: unknown) => JSON.stringify(body)

export const api = {
  // Auth
  register: (body: { userName: string; email: string; password: string; displayName?: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: json(body) }),
  login: (body: { userNameOrEmail: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: json(body) }),
  me: () => request<CurrentUser>('/auth/me'),

  // Juegos
  searchGames: (q: string, page = 1) =>
    request<GameSummary[]>(`/games/search?q=${encodeURIComponent(q)}&page=${page}`),
  popularGames: () => request<GameSummary[]>('/games/popular'),
  ranking: (limit = 50, genre?: string) =>
    request<RankedGame[]>(`/games/ranking?limit=${limit}${genre ? `&genre=${encodeURIComponent(genre)}` : ''}`),
  game: (rawgId: number) => request<GameDetail>(`/games/${rawgId}`),
  rateGame: (rawgId: number, score: number, review: string | null) =>
    request<MyRating>(`/games/${rawgId}/rating`, { method: 'PUT', body: json({ score, review }) }),
  deleteRating: (rawgId: number) => request<void>(`/games/${rawgId}/rating`, { method: 'DELETE' }),

  // Comunidad
  activity: (limit = 12) => request<Activity[]>(`/activity?limit=${limit}`),
  genres: () => request<Genre[]>('/genres'),

  // Perfiles
  profile: (userName: string) => request<Profile>(`/users/${encodeURIComponent(userName)}`),
  updateProfile: (body: { displayName: string; bio: string | null; avatarUrl: string | null }) =>
    request<void>('/me/profile', { method: 'PUT', body: json(body) }),
  updateTopGames: (rawgIds: number[]) =>
    request<void>('/me/top-games', { method: 'PUT', body: json({ rawgIds }) }),
  updateFavoriteGenres: (genreIds: number[]) =>
    request<void>('/me/favorite-genres', { method: 'PUT', body: json({ genreIds }) }),
}
