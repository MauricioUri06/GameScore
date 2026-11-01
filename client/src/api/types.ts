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
  finishedCount: number
  olderNewerBest: number
  coverQuizBest: number
  /** Mejor tiempo (s) para llegar a 1000 en Categorías; null si nunca lo logró */
  categoryBestSeconds: number | null
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
  description: string | null
  hoursPlayed: number
  lastEntry: JournalEntry | null
  journalCount: number
}

export interface OlderNewerGame {
  gameId: number
  name: string
  coverUrl: string | null
  /** null en el juego que hay que adivinar */
  year: number | null
}

export interface OlderNewerState {
  runId: string
  score: number
  left: OlderNewerGame
  right: OlderNewerGame
  best: number | null
  secondsPerQuestion: number
}

export interface OlderNewerGuessResult {
  correct: boolean
  rightYear: number
  score: number
  gameOver: boolean
  nextRight: OlderNewerGame | null
  best: number | null
  newRecord: boolean
  timedOut: boolean
}

/** Un puesto en el top de récords de un minijuego. */
export interface Leader {
  /** Puesto (los empates comparten puesto) */
  position: number
  userName: string
  avatarUrl: string | null
  best: number
}
/** Top 10 de un minijuego + tu puesto (null si no iniciaste sesión o no tienes récord). */
export interface LeaderboardData {
  top: Leader[]
  me: Leader | null
}

export interface CoverQuizState {
  runId: string
  round: number
  totalRounds: number
  score: number
  attempts: number
  maxAttempts: number
  hint: string
  imageUrl: string
  secondsLeft: number
  secondsPerRound: number
  roundOver: boolean
  gameOver: boolean
  best: number | null
  pointsByAttempt: number[]
}

export interface CategoryState {
  runId: string
  round: number
  score: number
  goal: number
  lives: number
  maxLives: number
  category: string
  secondsPerRound: number
  maxPoints: number
  minPoints: number
  roundOver: boolean
  gameOver: boolean
  won: boolean
  totalSeconds: number
  bestSeconds: number | null
}

export interface CategoryAnswerResult {
  correct: boolean
  alreadyUsed: boolean
  timedOut: boolean
  points: number
  gameName: string | null
  gameId: number | null
  state: CategoryState
  newRecord: boolean
}

export interface CoverQuizGuessResult {
  correct: boolean
  timedOut: boolean
  points: number
  answer: string | null
  answerGameId: number | null
  answerCoverUrl: string | null
  newRecord: boolean
  state: CoverQuizState
}

export interface FinishedGame {
  gameId: number
  name: string
  coverUrl: string | null
  finishedAt: string
  hoursPlayed: number
  score: number | null
  journalCount: number
}

export interface JournalEntry {
  id: number
  text: string
  createdAt: string
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
