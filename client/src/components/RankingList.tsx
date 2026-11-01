import { Link } from 'react-router-dom'
import type { RankedGame } from '../api/types'
import { igdbSize } from './GameCard'
import { Stars } from './Stars'

/** Lista de juegos rankeados (posición, portada, nombre y estrellas). */
export function RankingList({ games }: { games: RankedGame[] }) {
  return (
    <ol className="ranking-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {games.map((g) => (
        <li key={g.gameId}>
          <Link to={`/games/${g.gameId}`} className="ranking-row">
            <span className={`ranking-pos${g.position <= 3 ? ' podium' : ''}`}>{g.position}</span>
            {g.coverUrl ? (
              <img className="ranking-thumb" src={igdbSize(g.coverUrl, 'cover_big')} alt="" />
            ) : (
              <span className="ranking-thumb" />
            )}
            <span>
              <strong className="ranking-name">{g.name}</strong>
              <span className="small muted"> {g.released?.slice(0, 4)}</span>
            </span>
            <span className="ranking-score">
              <Stars value={g.averageScore} size="1.4rem" />
              <div className="small muted">
                {g.ratingsCount} {g.ratingsCount === 1 ? 'voto' : 'votos'}
              </div>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  )
}
