import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { GameCard, GameGridSkeleton, igdbSize } from '../components/GameCard'
import { GenreSelect } from '../components/GenreSelect'
import { Stars } from '../components/Stars'
import { Empty, ErrorMessage, Spinner } from '../components/Status'
import { useAsync } from '../hooks/useAsync'

export function RankingPage() {
  const [params, setParams] = useSearchParams()
  const genre = params.get('genre') ?? ''
  const genres = useAsync(() => api.genres(), [])
  const ranking = useAsync(() => api.ranking(100, genre || undefined), [genre])
  const popular = useAsync(() => api.popularGames(48), [])

  return (
    <div className="container page">
      <h1>Ranking de la comunidad</h1>
      <p className="muted page-intro">
        Los mejores juegos según la comunidad. Usamos un promedio ponderado: un juego necesita varias
        calificaciones para subir, así una sola nota perfecta no lo pone en la cima.
      </p>

      <GenreSelect
        genres={genres.data}
        value={genre}
        onChange={(slug) => setParams(slug ? { genre: slug } : {})}
        disabled={genres.loading}
      />

      {ranking.error ? (
        <ErrorMessage error={ranking.error} />
      ) : ranking.loading ? (
        <Spinner />
      ) : !ranking.data?.length ? (
        <Empty>
          Todavía no hay juegos calificados{genre ? ' en esta categoría' : ''}.{' '}
          <Link to="/juegos">Explora los juegos</Link> y califica el primero.
        </Empty>
      ) : (
        <ol className="ranking-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {ranking.data.map((g) => (
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
      )}

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
          <GameGridSkeleton count={10} />
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
