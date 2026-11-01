import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { GameCard, GameGridSkeleton } from '../components/GameCard'
import { Empty, ErrorMessage } from '../components/Status'
import { useAsync } from '../hooks/useAsync'

/** Lista de juegos disponibles: populares por defecto, o resultados de búsqueda con ?q=. */
export function GamesPage() {
  const [params, setParams] = useSearchParams()
  const q = (params.get('q') ?? '').trim()
  const isSearch = q.length >= 2

  const { data: games, error, loading } = useAsync(
    () => (isSearch ? api.searchGames(q) : api.popularGames()),
    [q],
  )

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const value = String(new FormData(e.currentTarget).get('q') ?? '').trim()
    setParams(value ? { q: value } : {})
  }

  return (
    <div className="container page">
      <h1>Juegos</h1>
      <form key={q} onSubmit={submit} className="row" style={{ marginBottom: 28 }} role="search">
        <input
          className="input"
          style={{ flex: 1, minWidth: 220 }}
          type="search"
          name="q"
          placeholder="Busca cualquier juego para calificarlo…"
          defaultValue={q}
        />
        <button className="btn btn-primary" type="submit">
          Buscar
        </button>
        {isSearch && (
          <button className="btn btn-ghost" type="button" onClick={() => setParams({})}>
            Ver populares
          </button>
        )}
      </form>

      <div className="section-header">
        <h2>{isSearch ? `Resultados para “${q}”` : 'Populares ahora'}</h2>
      </div>

      {error ? (
        <ErrorMessage error={error} />
      ) : loading ? (
        <GameGridSkeleton count={12} />
      ) : !games?.length ? (
        <Empty>{isSearch ? `No encontramos juegos para “${q}”.` : 'No hay juegos para mostrar.'}</Empty>
      ) : (
        <div className="game-grid">
          {games.map((g) => (
            <GameCard key={g.gameId} game={g} />
          ))}
        </div>
      )}
    </div>
  )
}
