import { Link } from 'react-router-dom'
import type { GameSummary } from '../api/types'

/**
 * Las imágenes de IGDB llevan el tamaño en la URL (/t_cover_big/, /t_1080p/…).
 * Esta función cambia el tamaño para descargar versiones más livianas en miniaturas.
 * Tamaños: cover_small (90x128), cover_big (264x374), 720p, 1080p.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function igdbSize(url: string, size: 'cover_small' | 'cover_big' | '720p' | '1080p'): string {
  return url.replace(/\/t_[a-z0-9_]+\//, `/t_${size}/`)
}

export function GameCover({ src, name }: { src: string | null; name: string }) {
  return src ? (
    <img src={src} alt="" loading="lazy" />
  ) : (
    <div className="game-cover-placeholder">{name.charAt(0)}</div>
  )
}

export function GameCard({ game }: { game: GameSummary }) {
  const year = game.released?.slice(0, 4)
  return (
    <Link to={`/games/${game.gameId}`} className="game-card">
      <div className="game-cover">
        <GameCover src={game.coverUrl} name={game.name} />
        {game.averageScore !== null && (
          <span className="score-pill overlay">★ {game.averageScore.toFixed(1)}</span>
        )}
      </div>
      <div className="game-card-body">
        <span className="game-card-title">{game.name}</span>
        <span className="game-card-meta">
          <span>{year ?? '—'}</span>
          <span>{game.genres[0] ?? ''}</span>
        </span>
      </div>
    </Link>
  )
}

export function GameGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="game-grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton" style={{ aspectRatio: '3 / 4.6' }} />
      ))}
    </div>
  )
}
