import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { GenreSelect } from '../components/GenreSelect'
import { RankingList } from '../components/RankingList'
import { Empty, ErrorMessage, Spinner } from '../components/Status'
import { useAsync } from '../hooks/useAsync'
import { useLang } from '../i18n/LanguageContext'

/** Ranking completo (hasta 100 juegos), con filtro de categoría. */
export function RankingPage() {
  const { t } = useLang()
  const [params, setParams] = useSearchParams()
  const genre = params.get('genre') ?? ''
  const genres = useAsync(() => api.genres(), [])
  const ranking = useAsync(() => api.ranking(100, genre || undefined), [genre])

  return (
    <div className="container page">
      <h1>{t('Ranking de la comunidad', 'Community ranking')}</h1>
      <p className="muted page-intro">
        {t(
          'Los mejores juegos según la comunidad. Usamos un promedio ponderado: un juego necesita varias calificaciones para subir, así una sola nota perfecta no lo pone en la cima.',
          'The best games according to the community. We use a weighted average: a game needs several ratings to climb, so a single perfect score won’t put it on top.',
        )}
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
          {genre
            ? t(
                'Todavía no hay juegos calificados en esta categoría.',
                'No games have been rated in this category yet.',
              )
            : t('Todavía no hay juegos calificados.', 'No games have been rated yet.')}{' '}
          <Link to="/juegos">{t('Explora los juegos', 'Browse the games')}</Link>{' '}
          {t('y califica el primero.', 'and rate the first one.')}
        </Empty>
      ) : (
        <RankingList games={ranking.data} />
      )}
    </div>
  )
}
