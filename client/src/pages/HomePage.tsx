import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { GameCard, GameGridSkeleton } from '../components/GameCard'
import { RankingList } from '../components/RankingList'
import { Empty, ErrorMessage, Spinner } from '../components/Status'
import { useAsync } from '../hooks/useAsync'

/** Inicio: top 10 de la comunidad y juegos populares. */
export function HomePage() {
  const ranking = useAsync(() => api.ranking(10), [])
  const popular = useAsync(() => api.popularGames(48), [])

  return (
    <div className="container page">
      <h1>Top 10 de la comunidad</h1>
      <p className="muted page-intro">
        Los juegos mejor calificados en GameScore.{' '}
        <Link to="/ranking">Ver el ranking completo →</Link>
      </p>

      <div style={{ marginTop: 28 }}>
        {ranking.error ? (
          <ErrorMessage error={ranking.error} />
        ) : ranking.loading ? (
          <Spinner />
        ) : !ranking.data?.length ? (
          <Empty>
            Todavía no hay juegos calificados. <Link to="/juegos">Explora los juegos</Link> y califica el primero.
          </Empty>
        ) : (
          <RankingList games={ranking.data} />
        )}
      </div>

      <section className="section">
        <div className="section-header">
          <h2>Populares ahora</h2>
          <Link to="/juegos" className="small">
            Ver todos los juegos →
          </Link>
        </div>
        {popular.error ? (
          <ErrorMessage error={popular.error} />
        ) : popular.loading ? (
          <GameGridSkeleton count={12} />
        ) : (
          <div className="game-grid">
            {popular.data?.map((g) => (
              <GameCard key={g.gameId} game={g} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
