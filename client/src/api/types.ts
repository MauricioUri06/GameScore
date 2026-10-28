// Tipos que reflejan los DTOs del backend (GameScore.Api/Dtos/Dtos.cs)

export interface CurrentUser {
  id: string
  userName: string
  displayName: string
  email: string
  avatarUrl: string | null
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

export interface GameSummary {
  rawgId: number
  slug: string
  name: string
  backgroundImage: string | null
  released: string | null
  genres: string[]
  averageScore: number | null
  ratingsCount: number
}

export interface Review {
  userName: string
  displayName: string
  avatarUrl: string | null
  score: number
  review: string | null
  updatedAt: string
}

export interface MyRating {
  score: number
  review: string | null
  updatedAt: string
}

export interface GameDetail {
  rawgId: number
  slug: string
  name: string
  backgroundImage: string | null
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
  rawgId: number
  slug: string
  name: string
  backgroundImage: string | null
  released: string | null
  averageScore: number
  weightedScore: number
  ratingsCount: number
}

export interface Activity {
  userName: string
  displayName: string
  avatarUrl: string | null
  rawgId: number
  gameName: string
  gameImage: string | null
  score: number
  review: string | null
  updatedAt: string
}

export interface TopGame {
  position: number
  rawgId: number
  slug: string
  name: string
  backgroundImage: string | null
}

export interface ProfileRating {
  rawgId: number
  gameName: string
  gameImage: string | null
  score: number
  review: string | null
  updatedAt: string
}

export interface Profile {
  userName: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  createdAt: string
  ratingsCount: number
  averageGiven: number | null
  topGames: TopGame[]
  favoriteGenres: Genre[]
  recentRatings: ProfileRating[]
}
