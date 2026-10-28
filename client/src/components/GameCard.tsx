import { Link } from 'react-router-dom'
import type { GameSummary } from '../api/types'

export function GameCover({ src, name }: { src: string | null; name: string }) {
  return src ? (
    <img src={resizeRawgImage(src, 420)} alt="" loading="lazy" />
  ) : (
    <div className="game-cover-placeholder">{name.charAt(0)}</div>
  )
}

/**
 * RAWG sirve imágenes grandes; su CDN acepta un tamaño en la ruta
 * (media/crop/600/400/...) para descargar versiones más livianas.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function resizeRawgImage(url: string, width: 420 | 640): string {
  if (!url.includes('media.rawg.io/media/')) return url
  const size = width === 420 ? 'crop/600/400' : 'resize/640/-'
  return url.replace('media.rawg.io/media/', `media.rawg.io/media/${size}/`)
}

export function GameCard({ game }: { game: GameSummary }) {
  const year = game.released?.slice(0, 4)
  return (
    <Link to={`/games/${game.rawgId}`} className="game-card">
      <div className="game-cover">
        <GameCover src={game.backgroundImage} name={game.name} />
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
