import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { GenreSelect } from '../components/GenreSelect'
import { Pagination } from '../components/Pagination'
import { RankingList } from '../components/RankingList'
import { Empty, ErrorMessage, Spinner } from '../components/Status'
import { useAsync } from '../hooks/useAsync'
import { useLang } from '../i18n/LanguageContext'

/** Ranking completo por páginas (de 50 en 50), con filtro de categoría (todo en la URL: ?genre=&page=). */
export function RankingPage() {
  const { t, locale } = useLang()
  const [params, setParams] = useSearchParams()
  const genre = params.get('genre') ?? ''
  const page = Math.max(1, Number(params.get('page')) || 1)
  const genres = useAsync(() => api.genres(), [])
  const ranking = useAsync(() => api.rankingPage(page, genre || undefined), [page, genre])

  const update = (changes: { genre?: string; page?: number }) => {
    const next = { genre, page: 1, ...changes }
    const out: Record<string, string> = {}
    if (next.genre) out.genre = next.genre
    if (next.page > 1) out.page = String(next.page)
    setParams(out)
  }

  const goToPage = (p: number) => {
    update({ page: p })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const data = ranking.data
  const first = data ? (data.page - 1) * data.pageSize + 1 : 0
  const last = data ? first + data.items.length - 1 : 0

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
        onChange={(slug) => update({ genre: slug })}
        disabled={genres.loading}
      />

      {data && data.totalCount > 0 && (
        <p className="muted small results-info">
          {first}–{last} {t('de', 'of')} {data.totalCount.toLocaleString(locale)}
        </p>
      )}

      {ranking.error ? (
        <ErrorMessage error={ranking.error} />
      ) : ranking.loading ? (
        <Spinner />
      ) : !data?.items.length ? (
        <Empty>
          {genre
            ? t('Todavía no hay juegos calificados en esta categoría.', 'No games have been rated in this category yet.')
            : t('Todavía no hay juegos calificados.', 'No games have been rated yet.')}{' '}
          <Link to="/juegos">{t('Explora los juegos', 'Browse the games')}</Link>{' '}
          {t('y califica el primero.', 'and rate the first one.')}
        </Empty>
      ) : (
        <>
          <RankingList games={data.items} />
          <Pagination page={data.page} totalPages={data.totalPages} onChange={goToPage} />
        </>
      )}
    </div>
  )
}
