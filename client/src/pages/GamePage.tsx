import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { GameDetail } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Avatar } from '../components/Avatar'
import { GameCover } from '../components/GameCard'
import { StarInput, Stars } from '../components/Stars'
import { Empty, ErrorMessage, Spinner } from '../components/Status'
import { useAsync } from '../hooks/useAsync'

export function GamePage() {
  const gameId = Number(useParams().gameId)
  const { data: game, error, loading, reload } = useAsync(() => api.game(gameId), [gameId])

  if (loading && !game) return <Spinner />
  if (error) {
    return (
      <div className="container page">
        <ErrorMessage error={error} />
      </div>
    )
  }
  if (!game) return null

  return (
    <>
      <div className="game-hero">
        {game.backgroundUrl && (
          <div className="game-hero-bg" style={{ backgroundImage: `url(${game.backgroundUrl})` }} />
        )}
        <div className="container game-hero-content">
          <div className="game-layout">
            <div className="game-poster">
              <GameCover src={game.coverUrl} name={game.name} />
            </div>

            <div>
              <h1>{game.name}</h1>
              <div className="row" style={{ marginBottom: 16 }}>
                {game.released && <span className="muted">{game.released.slice(0, 4)}</span>}
                <div className="tag-list">
                  {game.genres.map((g) => (
                    <Link key={g.id} to={`/ranking?genre=${g.slug}`} className="tag">
                      {g.name}
                    </Link>
                  ))}
                </div>
              </div>
              <Description text={game.description} />
            </div>

            <aside className="game-sidebar">
              <ScoreSummary game={game} />
              <RatePanel game={game} onSaved={reload} />
            </aside>
          </div>
        </div>
      </div>

      <div className="container page">
        <section>
          <div className="section-header">
            <h2>Reseñas recientes</h2>
          </div>
          {game.recentReviews.length === 0 ? (
            <Empty>Nadie ha calificado este juego todavía.</Empty>
          ) : (
            <div>
              {game.recentReviews.map((r) => (
                <article key={r.userName} className="review">
                  <Avatar url={r.avatarUrl} name={r.displayName} />
                  <div>
                    <div className="review-head">
                      <Link to={`/u/${r.userName}`}>
                        <strong>{r.displayName}</strong>
                      </Link>
                      <Stars value={r.score} size="0.9rem" />
                      <span className="faint">{new Date(r.updatedAt).toLocaleDateString()}</span>
                    </div>
                    {r.review && <p className="review-text">{r.review}</p>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}

function Description({ text }: { text: string | null }) {
  const [expanded, setExpanded] = useState(false)
  if (!text) return <p className="muted">Sin descripción.</p>
  const isLong = text.length > 600
  return (
    <>
      <p className={`game-description${expanded || !isLong ? ' expanded' : ''}`}>{text}</p>
      {isLong && (
        <button className="link-button" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Ver menos' : 'Leer más'}
        </button>
      )}
    </>
  )
}

function ScoreSummary({ game }: { game: GameDetail }) {
  const max = Math.max(1, ...game.distribution)
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="small muted">Promedio GameScore</div>
          <div className="score-big">{game.averageScore?.toFixed(1) ?? '–'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {game.averageScore !== null && <Stars value={game.averageScore} />}
          <div className="small muted">
            {game.ratingsCount} {game.ratingsCount === 1 ? 'calificación' : 'calificaciones'}
          </div>
        </div>
      </div>
      <div className="histogram" aria-hidden="true">
        {game.distribution.map((count, i) => (
          <div
            key={i}
            className="histogram-bar"
            style={{ height: `${(count / max) * 100}%` }}
            title={`${(i + 1) / 2} ★: ${count}`}
          />
        ))}
      </div>
      <div className="histogram-labels">
        <span>½★</span>
        <span>5★</span>
      </div>
    </div>
  )
}

function RatePanel({ game, onSaved }: { game: GameDetail; onSaved: () => void }) {
  const { user } = useAuth()
  const [score, setScore] = useState<number | null>(game.myRating?.score ?? null)
  const [review, setReview] = useState(game.myRating?.review ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setScore(game.myRating?.score ?? null)
    setReview(game.myRating?.review ?? '')
  }, [game.myRating])

  if (!user) {
    return (
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          Inicia sesión para calificar este juego.
        </p>
        <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
          Entrar
        </Link>
      </div>
    )
  }

  const save = async () => {
    if (score === null) return
    setSaving(true)
    setError(null)
    try {
      await api.rateGame(game.gameId, score, review.trim() || null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      onSaved()
    } catch (e) {
      setError(e)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    setSaving(true)
    setError(null)
    try {
      await api.deleteRating(game.gameId)
      onSaved()
    } catch (e) {
      setError(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card">
      <h3>{game.myRating ? 'Tu calificación' : 'Califícalo'}</h3>
      {error ? <ErrorMessage error={error} /> : null}
      {saved && <div className="alert alert-success">¡Guardado!</div>}
      <StarInput value={score} onChange={setScore} disabled={saving} />
      <div className="field" style={{ marginTop: 14 }}>
        <label htmlFor="review">Reseña (opcional)</label>
        <textarea
          id="review"
          className="textarea"
          maxLength={2000}
          placeholder="¿Qué te pareció?"
          value={review}
          onChange={(e) => setReview(e.target.value)}
        />
      </div>
      <div className="row">
        <button className="btn btn-primary" onClick={save} disabled={saving || score === null}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
        {game.myRating && (
          <button className="btn btn-danger btn-sm" onClick={remove} disabled={saving}>
            Quitar
          </button>
        )}
      </div>
    </div>
  )
}
