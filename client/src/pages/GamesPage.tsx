import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { Avatar } from '../components/Avatar'
import { GameCard, GameGridSkeleton } from '../components/GameCard'
import { GenreSelect } from '../components/GenreSelect'
import { Pagination } from '../components/Pagination'
import { SearchAutocomplete } from '../components/SearchAutocomplete'
import { Empty, ErrorMessage } from '../components/Status'
import { useAsync } from '../hooks/useAsync'
import { useLang } from '../i18n/LanguageContext'

/** Todos los juegos, de 48 en 48, con buscador y filtro de categoría (todo en la URL: ?q=&genre=&page=). */
export function GamesPage() {
  const { t, locale } = useLang()
  const [params, setParams] = useSearchParams()
  const q = (params.get('q') ?? '').trim()
  const genre = params.get('genre') ?? ''
  const page = Math.max(1, Number(params.get('page')) || 1)

  const genres = useAsync(() => api.genres(), [])
  const users = useAsync(() => (q.length >= 2 ? api.searchUsers(q, 12) : Promise.resolve([])), [q])
  const result = useAsync(
    () => api.games({ page, genre: genre || undefined, q: q.length >= 2 ? q : undefined }),
    [page, genre, q],
  )

  /** Cambia filtros manteniendo los demás; al cambiar búsqueda o categoría se vuelve a la página 1. */
  const update = (changes: { q?: string; genre?: string; page?: number }) => {
    const next = { q, genre, page: 1, ...changes }
    const out: Record<string, string> = {}
    if (next.q) out.q = next.q
    if (next.genre) out.genre = next.genre
    if (next.page > 1) out.page = String(next.page)
    setParams(out)
  }

  const goToPage = (p: number) => {
    update({ page: p })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const data = result.data
  const first = data ? (data.page - 1) * data.pageSize + 1 : 0
  const last = data ? first + data.items.length - 1 : 0

  return (
    <div className="container page">
      <h1>{t('Juegos', 'Games')}</h1>
      <div className="row search-row">
        <SearchAutocomplete
          key={q}
          className="games-search"
          placeholder={t('Busca un juego o un usuario…', 'Search for a game or a user…')}
          defaultValue={q}
          onSearch={(text) => update({ q: text })}
          showButton
        />
        {q && (
          <button className="btn btn-ghost" type="button" onClick={() => update({ q: '' })}>
            {t('Quitar búsqueda', 'Clear search')}
          </button>
        )}
      </div>

      {q && users.data && users.data.length > 0 && (
        <div className="user-results">
          <span className="filter-label">{t('Usuarios', 'Users')}</span>
          <div className="tag-list tag-list-center">
            {users.data.map((u) => (
              <Link key={u.userName} to={`/u/${u.userName}`} className="user-chip">
                <Avatar name={u.userName} url={u.avatarUrl} />
                {u.userName}
              </Link>
            ))}
          </div>
        </div>
      )}

      <GenreSelect
        genres={genres.data}
        value={genre}
        onChange={(slug) => update({ genre: slug })}
        disabled={genres.loading}
      />

      {data && data.totalCount > 0 && (
        <p className="muted small results-info">
          {q ? t(`Resultados para “${q}”`, `Results for “${q}”`) : t('Orden alfabético', 'Alphabetical order')} ·{' '}
          {first}–{last} {t('de', 'of')} {data.totalCount.toLocaleString(locale)}
        </p>
      )}

      {result.error ? (
        <ErrorMessage error={result.error} />
      ) : result.loading ? (
        <GameGridSkeleton count={20} />
      ) : !data?.items.length ? (
        <Empty>
          {q
            ? t(`No encontramos juegos para “${q}”.`, `We couldn't find games for “${q}”.`)
            : t('No hay juegos en esta categoría.', 'There are no games in this category.')}
        </Empty>
      ) : (
        <>
          <div className="game-grid">
            {data.items.map((g) => (
              <GameCard key={g.gameId} game={g} />
            ))}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={goToPage} />
        </>
      )}
    </div>
  )
}
