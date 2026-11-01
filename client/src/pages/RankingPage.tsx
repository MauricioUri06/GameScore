import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { GenreSelect } from '../components/GenreSelect'
import { RankingList } from '../components/RankingList'
import { Empty, ErrorMessage, Spinner } from '../components/Status'
import { useAsync } from '../hooks/useAsync'

/** Ranking completo (hasta 100 juegos), con filtro de categoría. */
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
        <RankingList games={ranking.data} />
      )}
    </div>
  )
}
