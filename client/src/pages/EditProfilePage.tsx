import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Genre, Profile } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { resizeRawgImage } from '../components/GameCard'
import { ErrorMessage, Spinner } from '../components/Status'
import { useAsync } from '../hooks/useAsync'

interface PickedGame {
  rawgId: number
  name: string
  backgroundImage: string | null
}

export function EditProfilePage() {
  const { user } = useAuth()
  const profile = useAsync(() => api.profile(user!.userName), [user?.userName])
  const genres = useAsync(() => api.genres(), [])

  if (profile.loading || genres.loading) return <Spinner />
  if (profile.error || !profile.data) {
    return (
      <div className="container page">
        <ErrorMessage error={profile.error} />
      </div>
    )
  }

  return (
    <div className="container page" style={{ maxWidth: 760 }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Editar perfil</h1>
        <Link to={`/u/${profile.data.userName}`} className="btn btn-ghost btn-sm">
          Ver mi perfil
        </Link>
      </div>
      <ProfileForm profile={profile.data} />
      <TopGamesEditor profile={profile.data} />
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

function ProfileForm({ profile }: { profile: Profile }) {
  const { refresh } = useAuth()
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? '')
  const { saving, run, feedback } = useSaveState()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      await api.updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
      })
      await refresh()
    })
  }

  return (
    <form className="card section" onSubmit={submit}>
      <h2>Datos</h2>
      {feedback}
      <div className="field">
        <label htmlFor="displayName">Nombre visible</label>
        <input
          id="displayName"
          className="input"
          maxLength={50}
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          className="textarea"
          maxLength={300}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Cuéntale a la comunidad qué juegas…"
        />
        <span className="hint">{bio.length}/300</span>
      </div>
      <div className="field">
        <label htmlFor="avatarUrl">URL de tu avatar</label>
        <input
          id="avatarUrl"
          className="input"
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://…"
        />
      </div>
      <button className="btn btn-primary" disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar datos'}
      </button>
    </form>
  )
}

function TopGamesEditor({ profile }: { profile: Profile }) {
  const [games, setGames] = useState<PickedGame[]>(
    profile.topGames.map((t) => ({ rawgId: t.rawgId, name: t.name, backgroundImage: t.backgroundImage })),
  )
  const { saving, run, feedback } = useSaveState()

  const move = (index: number, delta: number) => {
    const next = [...games]
    const [item] = next.splice(index, 1)
    next.splice(index + delta, 0, item)
    setGames(next)
  }

  const add = (game: PickedGame) => {
    if (games.length >= 5 || games.some((g) => g.rawgId === game.rawgId)) return
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
          <div key={g.rawgId} className="top5-editor-row">
            <strong style={{ width: 24 }}>#{i + 1}</strong>
            {g.backgroundImage ? (
              <img className="picker-thumb" src={resizeRawgImage(g.backgroundImage, 420)} alt="" />
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
              onClick={() => setGames(games.filter((x) => x.rawgId !== g.rawgId))}
              aria-label="Quitar"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {games.length < 5 && <GamePicker onPick={add} exclude={games.map((g) => g.rawgId)} />}

      <button
        className="btn btn-primary"
        style={{ marginTop: 16 }}
        disabled={saving}
        onClick={() => run(() => api.updateTopGames(games.map((g) => g.rawgId)))}
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

  const visible = results.filter((r) => !exclude.includes(r.rawgId)).slice(0, 8)

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
              key={g.rawgId}
              type="button"
              className="picker-item"
              onClick={() => {
                onPick({ rawgId: g.rawgId, name: g.name, backgroundImage: g.backgroundImage })
                setQ('')
                setResults([])
              }}
            >
              {g.backgroundImage ? <img src={resizeRawgImage(g.backgroundImage, 420)} alt="" /> : <span className="picker-thumb" />}
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
