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
  /** PC, PlayStation, Xbox, Nintendo… */
  name: string
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
  userName: string
  avatarUrl: string | null
  score: number
  review: string | null
  platformName: string | null
  updatedAt: string
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
