import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Genre, Medal, Platform, Profile } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Avatar } from '../components/Avatar'
import { AvatarCropper } from '../components/AvatarCropper'
import { MedalCircle } from '../components/MedalCircle'
import { igdbSize } from '../components/GameCard'
import { groupPlatforms } from '../components/PlatformList'
import { ErrorMessage, Spinner } from '../components/Status'
import { useAsync } from '../hooks/useAsync'

interface PickedGame {
  gameId: number
  name: string
  coverUrl: string | null
}

/** Lo que se guarda con el botón "Guardar cambios" (sin la foto, que se maneja aparte). */
interface Draft {
  games: PickedGame[]
  playing: PickedGame[]
  medalIds: string[]
  platformIds: number[]
  genreIds: number[]
}

/** Foto pendiente: una imagen nueva elegida, o la orden de quitar la actual. */
type AvatarChange = { kind: 'none' } | { kind: 'new'; image: Blob; preview: string } | { kind: 'remove' }

export function EditProfilePage() {
  const { user } = useAuth()
  const profile = useAsync(() => api.profile(user!.userName), [user?.userName])
  const genres = useAsync(() => api.genres(), [])
  const platforms = useAsync(() => api.platforms(), [])
  const medals = useAsync(() => api.medals(user!.userName), [user?.userName])

  if (profile.loading || genres.loading || platforms.loading || medals.loading) return <Spinner />
  const error = profile.error ?? genres.error ?? platforms.error ?? medals.error
  if (error || !profile.data) {
    return (
      <div className="container page">
        <ErrorMessage error={error} />
      </div>
    )
  }

  return (
    <ProfileEditor
      profile={profile.data}
      allGenres={genres.data ?? []}
      allPlatforms={platforms.data ?? []}
      earnedMedals={(medals.data ?? []).filter((m) => m.earned)}
    />
  )
}

function draftFrom(profile: Profile): Draft {
  return {
    games: profile.topGames.map((t) => ({ gameId: t.gameId, name: t.name, coverUrl: t.coverUrl })),
    playing: profile.playing.map((p) => ({ gameId: p.gameId, name: p.name, coverUrl: p.coverUrl })),
    medalIds: profile.medals.map((m) => m.id),
    platformIds: profile.platforms.map((p) => p.id),
    genreIds: profile.favoriteGenres.map((g) => g.id),
  }
}

/** Compara dos borradores (el orden del top 5 importa; el de plataformas y géneros no). */
function sameDraft(a: Draft, b: Draft) {
  const sorted = (xs: number[]) => [...xs].sort((x, y) => x - y).join(',')
  const ids = (gs: PickedGame[]) => gs.map((g) => g.gameId).join(',')
  return (
    ids(a.games) === ids(b.games) &&
    ids(a.playing) === ids(b.playing) &&
    a.medalIds.join(',') === b.medalIds.join(',') &&
    sorted(a.platformIds) === sorted(b.platformIds) &&
    sorted(a.genreIds) === sorted(b.genreIds)
  )
}

function ProfileEditor({
  profile,
  allGenres,
  allPlatforms,
  earnedMedals,
}: {
  profile: Profile
  allGenres: Genre[]
  allPlatforms: Platform[]
  earnedMedals: Medal[]
}) {
  const { user, refresh } = useAuth()
  const [saved, setSaved] = useState<Draft>(() => draftFrom(profile))
  const [draft, setDraft] = useState<Draft>(() => draftFrom(profile))
  const [avatar, setAvatar] = useState<AvatarChange>({ kind: 'none' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [justSaved, setJustSaved] = useState(false)

  const dirty = useMemo(() => !sameDraft(saved, draft) || avatar.kind !== 'none', [saved, draft, avatar])

  // Libera la vista previa de la foto cuando cambia o al salir de la página
  useEffect(() => {
    if (avatar.kind !== 'new') return
    return () => URL.revokeObjectURL(avatar.preview)
  }, [avatar])

  const update = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }))
    setJustSaved(false)
  }

  const saveAll = async () => {
    setSaving(true)
    setError(null)
    setJustSaved(false)
    try {
      if (avatar.kind === 'new') await api.uploadAvatar(avatar.image)
      if (avatar.kind === 'remove') await api.deleteAvatar()

      const changedGames = draft.games.map((g) => g.gameId).join(',') !== saved.games.map((g) => g.gameId).join(',')
      if (changedGames) await api.updateTopGames(draft.games.map((g) => g.gameId))
      const changedPlaying =
        draft.playing.map((g) => g.gameId).join(',') !== saved.playing.map((g) => g.gameId).join(',')
      if (changedPlaying) await api.updatePlaying(draft.playing.map((g) => g.gameId))
      if (draft.medalIds.join(',') !== saved.medalIds.join(',')) await api.updateShowcaseMedals(draft.medalIds)
      await Promise.all([api.updatePlatforms(draft.platformIds), api.updateFavoriteGenres(draft.genreIds)])

      if (avatar.kind !== 'none') await refresh()
      setSaved(draft)
      setAvatar({ kind: 'none' })
      setJustSaved(true)
    } catch (e) {
      setError(e)
    } finally {
      setSaving(false)
    }
  }

  const discard = () => {
    setDraft(saved)
    setAvatar({ kind: 'none' })
    setError(null)
  }

  if (!user) return null

  const avatarUrl = avatar.kind === 'new' ? avatar.preview : avatar.kind === 'remove' ? null : user.avatarUrl

  return (
    <div className="container page edit-profile" style={{ maxWidth: 760 }}>
      <div className="page-title">
        <h1>Editar perfil</h1>
        <Link to={`/u/${user.userName}`} className="btn btn-ghost btn-sm">
          Ver mi perfil
        </Link>
      </div>

      <AvatarSection
        userName={user.userName}
        url={avatarUrl}
        hasPhoto={Boolean(avatarUrl)}
        disabled={saving}
        onPick={(image, preview) => {
          setAvatar({ kind: 'new', image, preview })
          setJustSaved(false)
        }}
        onRemove={() => {
          setAvatar(user.avatarUrl ? { kind: 'remove' } : { kind: 'none' })
          setJustSaved(false)
        }}
      />
      <GameListSection
        title="Jugando ahora"
        hint="Los juegos que estás jugando en este momento (hasta 10)."
        max={10}
        numbered={false}
        games={draft.playing}
        onChange={(playing) => update({ playing })}
      />
      <GameListSection
        title="Tu top 5"
        hint="Busca y agrega hasta 5 juegos. Usa las flechas para ordenarlos."
        max={5}
        games={draft.games}
        onChange={(games) => update({ games })}
      />
      <PlatformsSection
        all={allPlatforms}
        selected={draft.platformIds}
        onChange={(platformIds) => update({ platformIds })}
      />
      <GenresSection all={allGenres} selected={draft.genreIds} onChange={(genreIds) => update({ genreIds })} />
      <MedalsSection earned={earnedMedals} selected={draft.medalIds} onChange={(medalIds) => update({ medalIds })} />

      <div className="save-bar">
        <div className="save-bar-status">
          {error ? (
            <ErrorMessage error={error} />
          ) : justSaved ? (
            <span className="save-ok">
              Cambios guardados. <Link to={`/u/${user.userName}`}>Ver mi perfil</Link>
            </span>
          ) : dirty ? (
            <span className="muted">Tienes cambios sin guardar.</span>
          ) : (
            <span className="faint">Sin cambios.</span>
          )}
        </div>
        <div className="row">
          {dirty && (
            <button type="button" className="btn btn-ghost" onClick={discard} disabled={saving}>
              Descartar
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={saveAll} disabled={saving || !dirty}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AvatarSection({
  userName,
  url,
  hasPhoto,
  disabled,
  onPick,
  onRemove,
}: {
  userName: string
  url: string | null
  hasPhoto: boolean
  disabled: boolean
  onPick: (image: Blob, preview: string) => void
  onRemove: () => void
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [cropping, setCropping] = useState<File | null>(null)

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir el mismo archivo
    if (file) setCropping(file)
  }

  return (
    <div className="card section avatar-editor">
      <h2>Foto de perfil</h2>
      {cropping ? (
        <AvatarCropper
          file={cropping}
          onCancel={() => setCropping(null)}
          onConfirm={(image) => {
            onPick(image, URL.createObjectURL(image))
            setCropping(null)
          }}
        />
      ) : (
        <>
          <Avatar name={userName} url={url} large />
          <p className="muted small" style={{ margin: 0 }}>
            JPG, PNG o WebP. Después de elegirla podrás encuadrarla y hacer zoom.
          </p>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onFile} />
          <div className="row" style={{ justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={disabled}
              onClick={() => fileInput.current?.click()}
            >
              {hasPhoto ? 'Cambiar foto' : 'Elegir foto'}
            </button>
            {hasPhoto && (
              <button type="button" className="btn btn-danger" disabled={disabled} onClick={onRemove}>
                Quitar foto
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/** Lista editable de juegos (top 5, jugando ahora): buscar, agregar, ordenar y quitar. */
function GameListSection({
  title,
  hint,
  max,
  numbered = true,
  games,
  onChange,
}: {
  title: string
  hint: string
  max: number
  numbered?: boolean
  games: PickedGame[]
  onChange: (games: PickedGame[]) => void
}) {
  const move = (index: number, delta: number) => {
    const next = [...games]
    const [item] = next.splice(index, 1)
    next.splice(index + delta, 0, item)
    onChange(next)
  }

  const add = (game: PickedGame) => {
    if (games.length >= max || games.some((g) => g.gameId === game.gameId)) return
    onChange([...games, game])
  }

  return (
    <div className="card section">
      <h2>{title}</h2>
      <p className="muted small" style={{ marginTop: 0, textAlign: 'center' }}>
        {hint}
      </p>

      <div className="top5-editor">
        {games.map((g, i) => (
          <div key={g.gameId} className="top5-editor-row">
            {numbered && <strong style={{ width: 24 }}>#{i + 1}</strong>}
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
              onClick={() => onChange(games.filter((x) => x.gameId !== g.gameId))}
              aria-label="Quitar"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {games.length < max && <GamePicker onPick={add} exclude={games.map((g) => g.gameId)} />}
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

  const visible = results.filter((r) => !exclude.includes(r.gameId))

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

function PlatformsSection({
  all,
  selected,
  onChange,
}: {
  all: Platform[]
  selected: number[]
  onChange: (ids: number[]) => void
}) {
  const toggle = (id: number) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

  return (
    <div className="card section">
      <h2>Mis plataformas</h2>
      <p className="muted small" style={{ marginTop: 0, textAlign: 'center' }}>
        Marca las consolas que tienes ({selected.length} seleccionadas).
      </p>
      <div className="platform-groups">
        {groupPlatforms(all).map(([family, items]) => (
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
    </div>
  )
}

function GenresSection({
  all,
  selected,
  onChange,
}: {
  all: Genre[]
  selected: number[]
  onChange: (ids: number[]) => void
}) {
  const toggle = (id: number) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

  return (
    <div className="card section">
      <h2>Géneros favoritos</h2>
      <p className="muted small" style={{ marginTop: 0, textAlign: 'center' }}>
        Elige todas las que quieras ({selected.length} seleccionadas).
      </p>
      <div className="tag-list tag-list-center">
        {all.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`tag${selected.includes(g.id) ? ' selected' : ''}`}
            aria-pressed={selected.includes(g.id)}
            onClick={() => toggle(g.id)}
          >
            {g.name}
          </button>
        ))}
      </div>
    </div>
  )
}

function MedalsSection({
  earned,
  selected,
  onChange,
}: {
  earned: Medal[]
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const max = 10
  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id))
    else if (selected.length < max) onChange([...selected, id])
  }

  return (
    <div className="card section">
      <h2>Medallas en tu perfil</h2>
      <p className="muted small" style={{ marginTop: 0, textAlign: 'center' }}>
        Elige hasta {max} de tus medallas para mostrar ({selected.length}/{max}). Se muestran en el orden en que las
        marques.
      </p>
      {earned.length === 0 ? (
        <p className="faint small" style={{ textAlign: 'center', margin: 0 }}>
          Todavía no tienes medallas. ¡Califica juegos y escribe reseñas para ganarlas!
        </p>
      ) : (
        <div className="medal-picker">
          {earned.map((m) => {
            const index = selected.indexOf(m.id)
            const isSelected = index >= 0
            return (
              <button
                key={m.id}
                type="button"
                className={`medal-pick${isSelected ? ' selected' : ''}`}
                aria-pressed={isSelected}
                disabled={!isSelected && selected.length >= max}
                onClick={() => toggle(m.id)}
              >
                <MedalCircle medal={m} />
                <span className="medal-pick-name">{m.name}</span>
                {isSelected && <span className="medal-pick-order">{index + 1}</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
