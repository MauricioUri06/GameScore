import type {
  Activity,
  AdminStats,
  AdminUser,
  AuthResponse,
  CurrentUser,
  GameDetail,
  FinishedGame,
  GameSummary,
  JournalEntry,
  Medal,
  Genre,
  MyRating,
  OlderNewerGuessResult,
  OlderNewerLeader,
  OlderNewerState,
  PagedResult,
  UserSearchResult,
  Platform,
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
  // Con FormData (subida de archivos) el navegador pone el Content-Type con su boundary
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type'))
    headers.set('Content-Type', 'application/json')

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
  register: (body: { userName: string; pin: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: json(body) }),
  login: (body: { userName: string; pin: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: json(body) }),
  me: () => request<CurrentUser>('/auth/me'),

  // Juegos
  searchGames: (q: string, limit?: number) =>
    request<GameSummary[]>(`/games/search?q=${encodeURIComponent(q)}${limit ? `&limit=${limit}` : ''}`),
  /** Todos los juegos, de 48 en 48, con filtros opcionales de categoría y nombre. */
  games: (params: { page: number; genre?: string; q?: string }) => {
    const qs = new URLSearchParams({ page: String(params.page) })
    if (params.genre) qs.set('genre', params.genre)
    if (params.q) qs.set('q', params.q)
    return request<PagedResult<GameSummary>>(`/games?${qs}`)
  },
  popularGames: (count = 12) => request<GameSummary[]>(`/games/popular?count=${count}`),
  ranking: (limit = 50, genre?: string) =>
    request<RankedGame[]>(`/games/ranking?limit=${limit}${genre ? `&genre=${encodeURIComponent(genre)}` : ''}`),
  game: (gameId: number) => request<GameDetail>(`/games/${gameId}`),
  rateGame: (gameId: number, score: number, review: string | null, platformId: number) =>
    request<MyRating>(`/games/${gameId}/rating`, { method: 'PUT', body: json({ score, review, platformId }) }),
  deleteRating: (gameId: number) => request<void>(`/games/${gameId}/rating`, { method: 'DELETE' }),
  /** 1 = like, -1 = dislike, 0 = quitar voto */
  voteReview: (ratingId: number, value: 1 | -1 | 0) =>
    request<{ likes: number; dislikes: number; myVote: number }>(`/reviews/${ratingId}/vote`, {
      method: 'PUT',
      body: json({ value }),
    }),

  // Comunidad
  activity: (limit = 12) => request<Activity[]>(`/activity?limit=${limit}`),
  genres: () => request<Genre[]>('/genres'),

  // Perfiles
  searchUsers: (q: string, limit = 10) =>
    request<UserSearchResult[]>(`/users?q=${encodeURIComponent(q)}&limit=${limit}`),
  profile: (userName: string) => request<Profile>(`/users/${encodeURIComponent(userName)}`),
  uploadAvatar: (image: Blob) => {
    const form = new FormData()
    form.append('file', image, 'avatar.jpg')
    return request<{ avatarUrl: string | null }>('/me/avatar', { method: 'PUT', body: form })
  },
  deleteAvatar: () => request<void>('/me/avatar', { method: 'DELETE' }),
  platforms: () => request<Platform[]>('/platforms'),

  // Administración (solo admins)
  adminStats: () => request<AdminStats>('/admin/stats'),
  adminUsers: () => request<AdminUser[]>('/admin/users'),
  updatePlatforms: (platformIds: number[]) =>
    request<void>('/me/platforms', { method: 'PUT', body: json({ platformIds }) }),
  updatePlaying: (gameIds: number[]) =>
    request<void>('/me/playing', { method: 'PUT', body: json({ gameIds }) }),
  addPlayingHours: (gameId: number, hours: number) =>
    request<{ hoursPlayed: number }>(`/me/playing/${gameId}/hours`, { method: 'POST', body: json({ hours }) }),
  journal: (userName: string, gameId: number) =>
    request<JournalEntry[]>(`/users/${encodeURIComponent(userName)}/journal/${gameId}`),
  addJournalEntry: (gameId: number, text: string) =>
    request<JournalEntry>(`/me/playing/${gameId}/journal`, { method: 'POST', body: json({ text }) }),
  deleteJournalEntry: (entryId: number) => request<void>(`/me/journal/${entryId}`, { method: 'DELETE' }),
  finished: (userName: string) => request<FinishedGame[]>(`/users/${encodeURIComponent(userName)}/finished`),
  finishPlaying: (gameId: number) => request<void>(`/me/playing/${gameId}/finish`, { method: 'POST' }),
  deleteFinished: (gameId: number) => request<void>(`/me/finished/${gameId}`, { method: 'DELETE' }),
  olderNewerStart: () => request<OlderNewerState>('/older-newer/start', { method: 'POST' }),
  olderNewerGuess: (runId: string, guess: 'older' | 'newer') =>
    request<OlderNewerGuessResult>(`/older-newer/${runId}/guess`, { method: 'POST', body: json({ guess }) }),
  olderNewerLeaderboard: () => request<OlderNewerLeader[]>('/older-newer/leaderboard'),
  medals: (userName: string) => request<Medal[]>(`/users/${encodeURIComponent(userName)}/medals`),
  updateShowcaseMedals: (medalIds: string[]) =>
    request<void>('/me/medals', { method: 'PUT', body: json({ medalIds }) }),
  updateTopGames: (gameIds: number[]) =>
    request<void>('/me/top-games', { method: 'PUT', body: json({ gameIds }) }),
  updateFavoriteGenres: (genreIds: number[]) =>
    request<void>('/me/favorite-genres', { method: 'PUT', body: json({ genreIds }) }),
}
