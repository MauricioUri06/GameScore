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
      <h1>Ranking de la comunidad</h1>
      <p className="muted page-intro">
        Los mejores juegos según la comunidad. Usamos un promedio ponderado: un juego necesita varias
        calificaciones para subir, así una sola nota perfecta no lo pone en la cima.
      </p>

      <div className="filter-bar">
        <label htmlFor="genre" className="filter-label">
          Categoría
        </label>
        <select
          id="genre"
          className="select"
          value={genre}
          onChange={(e) => setParams(e.target.value ? { genre: e.target.value } : {})}
          disabled={genres.loading}
        >
          <option value="">Todas las categorías</option>
          {genres.data?.map((g) => (
            <option key={g.id} value={g.slug}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {ranking.error ? (
        <ErrorMessage error={ranking.error} />
      ) : ranking.loading ? (
        <Spinner />
      ) : !ranking.data?.length ? (
        <Empty>
          Todavía no hay juegos calificados{genre ? ' en este género' : ''}.{' '}
          <Link to="/juegos">Explora los juegos</Link> y califica el primero.
        </Empty>
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
