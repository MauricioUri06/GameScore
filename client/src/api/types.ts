// Tipos que reflejan los DTOs del backend (GameScore.Api/Dtos/Dtos.cs)
// gameId = id del juego en IGDB

export interface CurrentUser {
  id: string
  userName: string
  avatarUrl: string | null
  isAdmin: boolean
}

export interface AuthResponse {
  token: string
  expiresAt: string
  user: CurrentUser
}

export interface Genre {
  id: number
  name: string
  slug: string
}

export interface Platform {
  id: number
  /** PS5, Switch, PC (Windows)… */
  name: string
  /** PC, PlayStation, Xbox, Nintendo u Otras */
  family: string
}

export interface GameSummary {
  gameId: number
  slug: string
  name: string
  coverUrl: string | null
  released: string | null
  genres: string[]
  averageScore: number | null
  ratingsCount: number
}

export interface Review {
  ratingId: number
  userName: string
  avatarUrl: string | null
  score: number
  review: string | null
  platformName: string | null
  updatedAt: string
  likes: number
  dislikes: number
  /** 1 = like, -1 = dislike, 0 = sin voto */
  myVote: number
}

export interface MyRating {
  score: number
  review: string | null
  platformId: number | null
  updatedAt: string
}

export interface GameDetail {
  gameId: number
  slug: string
  name: string
  coverUrl: string | null
  backgroundUrl: string | null
  released: string | null
  description: string | null
  genres: Genre[]
  averageScore: number | null
  ratingsCount: number
  distribution: number[]
  myRating: MyRating | null
  recentReviews: Review[]
  /** Consolas donde salió el juego (vacío = sin datos) */
  availablePlatforms: Platform[]
  /** Calificaciones con texto */
  reviewsCount: number
}

export interface RankedGame {
  position: number
  gameId: number
  slug: string
  name: string
  coverUrl: string | null
  released: string | null
  averageScore: number
  weightedScore: number
  ratingsCount: number
}

export interface Activity {
  userName: string
  avatarUrl: string | null
  gameId: number
  gameName: string
  gameCover: string | null
  score: number
  review: string | null
  updatedAt: string
}

export interface TopGame {
  position: number
  gameId: number
  slug: string
  name: string
  coverUrl: string | null
}

export interface ProfileRating {
  gameId: number
  gameName: string
  gameCover: string | null
  score: number
  review: string | null
  platformName: string | null
  updatedAt: string
}

export interface Profile {
  userName: string
  avatarUrl: string | null
  createdAt: string
  ratingsCount: number
  averageGiven: number | null
  topGames: TopGame[]
  favoriteGenres: Genre[]
  platforms: Platform[]
  recentRatings: ProfileRating[]
  playing: PlayingGame[]
  /** Medallas que el usuario eligió mostrar (máx. 10) */
  medals: Medal[]
  medalsEarned: number
  medalsTotal: number
  reviewsCount: number
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

// ---------- Administración ----------

export interface CountByName {
  name: string
  count: number
}

export interface AdminStats {
  users: number
  newUsersLast7Days: number
  ratings: number
  ratingsLast7Days: number
  reviewsWithText: number
  gamesInDatabase: number
  averageScore: number | null
  ratingsByPlatform: CountByName[]
  usersByPlatform: CountByName[]
}

export interface AdminUser {
  userName: string
  avatarUrl: string | null
  createdAt: string
  ratings: number
  reviewsWithText: number
  averageScore: number | null
  lastActivity: string | null
  topGames: number
  favoriteGenres: number
  platforms: string[]
  isLockedOut: boolean
  failedLoginAttempts: number
}

export interface UserSearchResult {
  userName: string
  avatarUrl: string | null
  ratings: number
}

export interface PlayingGame {
  gameId: number
  name: string
  coverUrl: string | null
}

export interface Medal {
  id: string
  name: string
  description: string
  icon: string
  category: string
  progress: number
  target: number
  earned: boolean
}
