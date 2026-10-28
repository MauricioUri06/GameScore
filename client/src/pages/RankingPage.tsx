import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { igdbSize } from '../components/GameCard'
import { Stars } from '../components/Stars'
import { Empty, ErrorMessage, Spinner } from '../components/Status'
import { useAsync } from '../hooks/useAsync'

export function RankingPage() {
  const [params, setParams] = useSearchParams()
  const genre = params.get('genre') ?? ''
  const genres = useAsync(() => api.genres(), [])
  const ranking = useAsync(() => api.ranking(100, genre || undefined), [genre])

  return (
    <div className="container page">
      <h1>Ranking</h1>
      <p className="muted" style={{ maxWidth: 640 }}>
        Los mejores juegos según la comunidad. Usamos un promedio ponderado: un juego necesita varias
        calificaciones para subir, así una sola nota perfecta no lo pone en la cima.
      </p>

      <div className="tag-list" style={{ margin: '20px 0 28px' }}>
        <button className={`tag${genre === '' ? ' selected' : ''}`} onClick={() => setParams({})}>
          Todos
        </button>
        {genres.data?.map((g) => (
          <button
            key={g.id}
            className={`tag${genre === g.slug ? ' selected' : ''}`}
            onClick={() => setParams({ genre: g.slug })}
          >
            {g.name}
          </button>
        ))}
      </div>

      {ranking.error ? (
        <ErrorMessage error={ranking.error} />
      ) : ranking.loading ? (
        <Spinner />
      ) : !ranking.data?.length ? (
        <Empty>Todavía no hay juegos calificados{genre ? ' en este género' : ''}.</Empty>
      ) : (
        <ol className="ranking-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {ranking.data.map((g) => (
            <li key={g.gameId}>
              <Link to={`/games/${g.gameId}`} className="ranking-row">
                <span className={`ranking-pos${g.position <= 3 ? ' podium' : ''}`}>{g.position}</span>
                {g.coverUrl ? (
                  <img className="ranking-thumb" src={igdbSize(g.coverUrl, 'cover_small')} alt="" />
                ) : (
                  <span className="ranking-thumb" />
                )}
                <span>
                  <strong>{g.name}</strong>
                  <span className="small muted"> {g.released?.slice(0, 4)}</span>
                  <br />
                  <Stars value={g.averageScore} size="0.85rem" />
                </span>
                <span className="ranking-score">
                  <strong>{g.averageScore.toFixed(2)}</strong>
                  <div className="small muted">{g.ratingsCount} votos</div>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
