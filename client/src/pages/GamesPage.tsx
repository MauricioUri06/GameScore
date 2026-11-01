import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { GameCard, GameGridSkeleton } from '../components/GameCard'
import { GenreSelect } from '../components/GenreSelect'
import { Pagination } from '../components/Pagination'
import { Empty, ErrorMessage } from '../components/Status'
import { useAsync } from '../hooks/useAsync'

/** Todos los juegos, de 48 en 48, con buscador y filtro de categoría (todo en la URL: ?q=&genre=&page=). */
export function GamesPage() {
  const [params, setParams] = useSearchParams()
  const q = (params.get('q') ?? '').trim()
  const genre = params.get('genre') ?? ''
  const page = Math.max(1, Number(params.get('page')) || 1)

  const genres = useAsync(() => api.genres(), [])
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

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    update({ q: String(new FormData(e.currentTarget).get('q') ?? '').trim() })
  }

  const data = result.data
  const first = data ? (data.page - 1) * data.pageSize + 1 : 0
  const last = data ? first + data.items.length - 1 : 0

  return (
    <div className="container page">
      <h1>Juegos</h1>
      <form key={q} onSubmit={submit} className="row search-row" role="search">
        <input
          className="input"
          style={{ flex: 1, minWidth: 220 }}
          type="search"
          name="q"
          placeholder="Busca un juego por nombre…"
          defaultValue={q}
        />
        <button className="btn btn-primary" type="submit">
          Buscar
        </button>
        {q && (
          <button className="btn btn-ghost" type="button" onClick={() => update({ q: '' })}>
            Quitar búsqueda
          </button>
        )}
      </form>

      <GenreSelect
        genres={genres.data}
        value={genre}
        onChange={(slug) => update({ genre: slug })}
        disabled={genres.loading}
      />

      {data && data.totalCount > 0 && (
        <p className="muted small results-info">
          {q ? `Resultados para “${q}”` : 'Del más popular al menos popular'} · {first}–{last} de{' '}
          {data.totalCount.toLocaleString('es')}
        </p>
      )}

      {result.error ? (
        <ErrorMessage error={result.error} />
      ) : result.loading ? (
        <GameGridSkeleton count={20} />
      ) : !data?.items.length ? (
        <Empty>{q ? `No encontramos juegos para “${q}”.` : 'No hay juegos en esta categoría.'}</Empty>
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
