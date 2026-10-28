import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import type { GameSummary } from '../api/types'
import { GameCard, GameGridSkeleton } from '../components/GameCard'
import { Empty, ErrorMessage } from '../components/Status'

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [input, setInput] = useState(q)
  const [results, setResults] = useState<GameSummary[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setInput(q)
    if (q.trim().length < 2) {
      setResults(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    api
      .searchGames(q)
      .then((r) => !cancelled && setResults(r))
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [q])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setParams(input.trim() ? { q: input.trim() } : {})
  }

  return (
    <div className="container page">
      <h1>Explorar juegos</h1>
      <form onSubmit={submit} className="row" style={{ marginBottom: 28 }} role="search">
        <input
          className="input"
          style={{ flex: 1, minWidth: 220 }}
          type="search"
          placeholder="Escribe el nombre de un juego…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
        />
        <button className="btn btn-primary" type="submit">
          Buscar
        </button>
      </form>

      {error ? (
        <ErrorMessage error={error} />
      ) : loading ? (
        <GameGridSkeleton count={10} />
      ) : results === null ? (
        <Empty>Busca cualquier juego para ver su ficha y calificarlo.</Empty>
      ) : results.length === 0 ? (
        <Empty>No encontramos juegos para “{q}”.</Empty>
      ) : (
        <div className="game-grid">
          {results.map((g) => (
            <GameCard key={g.rawgId} game={g} />
          ))}
        </div>
      )}
    </div>
  )
}
