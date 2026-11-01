import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Genre, Platform, Profile } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { igdbSize } from '../components/GameCard'
import { groupPlatforms } from '../components/PlatformList'
import { ErrorMessage, Spinner } from '../components/Status'
import { useAsync } from '../hooks/useAsync'

interface PickedGame {
  gameId: number
  name: string
  coverUrl: string | null
}

export function EditProfilePage() {
  const { user } = useAuth()
  const profile = useAsync(() => api.profile(user!.userName), [user?.userName])
  const genres = useAsync(() => api.genres(), [])
  const platforms = useAsync(() => api.platforms(), [])

  if (profile.loading || genres.loading || platforms.loading) return <Spinner />
  if (profile.error || !profile.data) {
    return (
      <div className="container page">
        <ErrorMessage error={profile.error} />
      </div>
    )
  }

  return (
    <div className="container page" style={{ maxWidth: 760 }}>
      <div className="page-title">
        <h1>Editar perfil</h1>
        <Link to={`/u/${profile.data.userName}`} className="btn btn-ghost btn-sm">
          Ver mi perfil
        </Link>
      </div>
      <TopGamesEditor profile={profile.data} />
      {platforms.error ? (
        <ErrorMessage error={platforms.error} />
      ) : (
        <PlatformsEditor profile={profile.data} allPlatforms={platforms.data ?? []} />
      )}
      {genres.error ? (
        <ErrorMessage error={genres.error} />
      ) : (
        <GenresEditor profile={profile.data} allGenres={genres.data ?? []} />
      )}
    </div>
  )
}

function useSaveState() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [saved, setSaved] = useState(false)

  const run = async (fn: () => Promise<void>) => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await fn()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e)
    } finally {
      setSaving(false)
    }
  }

  const feedback = (
    <>
      {error ? <ErrorMessage error={error} /> : null}
      {saved && <div className="alert alert-success">Cambios guardados.</div>}
    </>
  )

  return { saving, run, feedback }
}

function TopGamesEditor({ profile }: { profile: Profile }) {
  const [games, setGames] = useState<PickedGame[]>(
    profile.topGames.map((t) => ({ gameId: t.gameId, name: t.name, coverUrl: t.coverUrl })),
  )
  const { saving, run, feedback } = useSaveState()

  const move = (index: number, delta: number) => {
    const next = [...games]
    const [item] = next.splice(index, 1)
    next.splice(index + delta, 0, item)
    setGames(next)
  }

  const add = (game: PickedGame) => {
    if (games.length >= 5 || games.some((g) => g.gameId === game.gameId)) return
    setGames([...games, game])
  }

  return (
    <div className="card section">
      <h2>Tu top 5</h2>
      <p className="muted small" style={{ marginTop: 0 }}>
        Busca y agrega hasta 5 juegos. Usa las flechas para ordenarlos.
      </p>
      {feedback}

      <div className="top5-editor">
        {games.map((g, i) => (
          <div key={g.gameId} className="top5-editor-row">
            <strong style={{ width: 24 }}>#{i + 1}</strong>
            {g.coverUrl ? (
              <img className="picker-thumb" src={igdbSize(g.coverUrl, 'cover_small')} alt="" />
            ) : (
              <span className="picker-thumb" />
            )}
            <span className="grow">{g.name}</span>
            <button type="button" className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir">
              ↑
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => move(i, 1)}
              disabled={i === games.length - 1}
              aria-label="Bajar"
            >
              ↓
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setGames(games.filter((x) => x.gameId !== g.gameId))}
              aria-label="Quitar"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {games.length < 5 && <GamePicker onPick={add} exclude={games.map((g) => g.gameId)} />}

      <button
        className="btn btn-primary"
        style={{ marginTop: 16 }}
        disabled={saving}
        onClick={() => run(() => api.updateTopGames(games.map((g) => g.gameId)))}
      >
        {saving ? 'Guardando…' : 'Guardar top 5'}
      </button>
    </div>
  )
}

function GamePicker({ onPick, exclude }: { onPick: (g: PickedGame) => void; exclude: number[] }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<PickedGame[]>([])
  const [loading, setLoading] = useState(false)

  // Búsqueda con "debounce": espera 350 ms después de la última tecla
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    let cancelled = false
    const timer = setTimeout(() => {
      setLoading(true)
      api
        .searchGames(q.trim())
        .then((r) => !cancelled && setResults(r))
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setLoading(false))
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [q])

  const visible = results.filter((r) => !exclude.includes(r.gameId)).slice(0, 8)

  return (
    <div style={{ marginTop: 12 }}>
      <input
        className="input"
        type="search"
        placeholder="Buscar un juego para agregar…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {loading && <p className="small muted">Buscando…</p>}
      {visible.length > 0 && (
        <div className="picker-results">
          {visible.map((g) => (
            <button
              key={g.gameId}
              type="button"
              className="picker-item"
              onClick={() => {
                onPick({ gameId: g.gameId, name: g.name, coverUrl: g.coverUrl })
                setQ('')
                setResults([])
              }}
            >
              {g.coverUrl ? <img src={igdbSize(g.coverUrl, 'cover_small')} alt="" /> : <span className="picker-thumb" />}
              <span>{g.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function GenresEditor({ profile, allGenres }: { profile: Profile; allGenres: Genre[] }) {
  const [selected, setSelected] = useState<number[]>(profile.favoriteGenres.map((g) => g.id))
  const { saving, run, feedback } = useSaveState()

  const toggle = (id: number) => {
    if (selected.includes(id)) setSelected(selected.filter((x) => x !== id))
    else if (selected.length < 5) setSelected([...selected, id])
  }

  return (
    <div className="card section">
      <h2>Géneros favoritos</h2>
      <p className="muted small" style={{ marginTop: 0 }}>
        Elige hasta 5 ({selected.length}/5).
      </p>
      {feedback}
      <div className="tag-list">
        {allGenres.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`tag${selected.includes(g.id) ? ' selected' : ''}`}
            onClick={() => toggle(g.id)}
          >
            {g.name}
          </button>
        ))}
      </div>
      <button
        className="btn btn-primary"
        style={{ marginTop: 16 }}
        disabled={saving}
        onClick={() => run(() => api.updateFavoriteGenres(selected))}
      >
        {saving ? 'Guardando…' : 'Guardar géneros'}
      </button>
    </div>
  )
}

function PlatformsEditor({ profile, allPlatforms }: { profile: Profile; allPlatforms: Platform[] }) {
  const [selected, setSelected] = useState<number[]>(profile.platforms.map((p) => p.id))
  const { saving, run, feedback } = useSaveState()

  const toggle = (id: number) =>
    setSelected(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

  return (
    <div className="card section">
      <h2>Mis plataformas</h2>
      <p className="muted small" style={{ marginTop: 0 }}>
        Marca las consolas y plataformas que tienes ({selected.length} seleccionadas).
      </p>
      {feedback}
      <div className="platform-groups">
        {groupPlatforms(allPlatforms).map(([family, items]) => (
          <div key={family} className="platform-group">
            <span className="platform-family">{family}</span>
            <div className="tag-list">
              {items.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`tag${selected.includes(p.id) ? ' selected' : ''}`}
                  aria-pressed={selected.includes(p.id)}
                  onClick={() => toggle(p.id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        className="btn btn-primary"
        style={{ marginTop: 16 }}
        disabled={saving}
        onClick={() => run(() => api.updatePlatforms(selected))}
      >
        {saving ? 'Guardando…' : 'Guardar plataformas'}
      </button>
    </div>
  )
}
