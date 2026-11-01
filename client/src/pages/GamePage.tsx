import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { GameDetail, Platform, Review } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Avatar } from '../components/Avatar'
import { GameCover } from '../components/GameCard'
import { groupPlatforms } from '../components/PlatformList'
import { StarInput, Stars } from '../components/Stars'
import { Empty, ErrorMessage, Spinner } from '../components/Status'
import { useAsync } from '../hooks/useAsync'
import { useLang } from '../i18n/LanguageContext'
import { genreName, platformFamily, serverError } from '../i18n/serverText'

export function GamePage() {
  const { t, lang } = useLang()
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
              <p className="game-counts">
                <strong>{game.reviewsCount}</strong>{' '}
                {game.reviewsCount === 1 ? t('reseña', 'review') : t('reseñas', 'reviews')} ·{' '}
                <strong>{game.ratingsCount}</strong>{' '}
                {game.ratingsCount === 1 ? t('calificación', 'rating') : t('calificaciones', 'ratings')}
              </p>
              <div className="row" style={{ marginBottom: 16 }}>
                {game.released && <span className="muted">{game.released.slice(0, 4)}</span>}
                <div className="tag-list">
                  {game.genres.map((g) => (
                    <Link key={g.id} to={`/ranking?genre=${g.slug}`} className="tag">
                      {genreName(g.name, lang)}
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
            <h2>
              {t('Reseñas', 'Reviews')} ({game.reviewsCount})
            </h2>
          </div>
          {game.recentReviews.length === 0 ? (
            <Empty>{t('Nadie ha calificado este juego todavía.', 'Nobody has rated this game yet.')}</Empty>
          ) : (
            <div>
              {game.recentReviews.map((r) => (
                <ReviewItem key={r.ratingId} review={r} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}

function Description({ text }: { text: string | null }) {
  const { t } = useLang()
  const [expanded, setExpanded] = useState(false)
  if (!text) return <p className="muted">{t('Sin descripción.', 'No description.')}</p>
  const isLong = text.length > 600
  return (
    <>
      <p className={`game-description${expanded || !isLong ? ' expanded' : ''}`}>{text}</p>
      {isLong && (
        <button className="link-button" onClick={() => setExpanded((v) => !v)}>
          {expanded ? t('Ver menos', 'Show less') : t('Leer más', 'Read more')}
        </button>
      )}
    </>
  )
}

function ScoreSummary({ game }: { game: GameDetail }) {
  const { t } = useLang()
  const max = Math.max(1, ...game.distribution)
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="small muted">{t('Promedio GameScore', 'GameScore average')}</div>
          <div className="score-big">{game.averageScore?.toFixed(1) ?? '–'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {game.averageScore !== null && <Stars value={game.averageScore} />}
          <div className="small muted">
            {game.ratingsCount} {game.ratingsCount === 1 ? t('calificación', 'rating') : t('calificaciones', 'ratings')}{' '}
            · {game.reviewsCount} {game.reviewsCount === 1 ? t('reseña', 'review') : t('reseñas', 'reviews')}
          </div>
        </div>
      </div>
      <div className="histogram" aria-hidden="true">
        {game.distribution.map((count, i) => (
          <div
            key={i}
            className="histogram-bar"
            style={{ height: `${(count / max) * 100}%` }}
            title={`${i / 2} ★: ${count}`}
          />
        ))}
      </div>
      <div className="histogram-labels">
        <span>0★</span>
        <span>5★</span>
      </div>
    </div>
  )
}

function RatePanel({ game, onSaved }: { game: GameDetail; onSaved: () => void }) {
  const { t, lang } = useLang()
  const { user } = useAuth()
  const [score, setScore] = useState<number | null>(game.myRating?.score ?? null)
  const [review, setReview] = useState(game.myRating?.review ?? '')
  const [platformId, setPlatformId] = useState<number | ''>(game.myRating?.platformId ?? '')
  const platforms = useAsync(() => api.platforms(), [])
  // Solo las consolas donde salió el juego; si IGDB no lo sabe, todas
  const choices: Platform[] = game.availablePlatforms.length ? game.availablePlatforms : (platforms.data ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setScore(game.myRating?.score ?? null)
    setReview(game.myRating?.review ?? '')
    setPlatformId(game.myRating?.platformId ?? '')
  }, [game.myRating])

  if (!user) {
    return (
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          {t('Inicia sesión para calificar este juego.', 'Log in to rate this game.')}
        </p>
        <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
          {t('Entrar', 'Log in')}
        </Link>
      </div>
    )
  }

  const save = async () => {
    if (score === null) return
    if (platformId === '') {
      setError(new Error(t('Elige en qué consola lo jugaste.', 'Choose which console you played it on.')))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.rateGame(game.gameId, score, review.trim() || null, platformId)
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
      <h3>{game.myRating ? t('Tu calificación', 'Your rating') : t('Califícalo', 'Rate it')}</h3>
      {error ? <ErrorMessage error={error} /> : null}
      {saved && <div className="alert alert-success">{t('¡Guardado!', 'Saved!')}</div>}
      <StarInput value={score} onChange={setScore} disabled={saving} />
      <div className="field" style={{ marginTop: 14 }}>
        <label htmlFor="platform">{t('¿En qué consola lo jugaste?', 'Which console did you play it on?')}</label>
        <select
          id="platform"
          className="select"
          value={platformId}
          onChange={(e) => setPlatformId(e.target.value ? Number(e.target.value) : '')}
          disabled={saving || platforms.loading}
        >
          <option value="">{t('Elige una consola…', 'Choose a console…')}</option>
          {groupPlatforms(choices).map(([family, items]) => (
            <optgroup key={family} label={platformFamily(family, lang)}>
              {items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="review">{t('Reseña (opcional)', 'Review (optional)')}</label>
        <textarea
          id="review"
          className="textarea"
          maxLength={2000}
          placeholder={t('¿Qué te pareció?', 'What did you think?')}
          value={review}
          onChange={(e) => setReview(e.target.value)}
        />
      </div>
      <div className="row">
        <button className="btn btn-primary" onClick={save} disabled={saving || score === null}>
          {saving ? t('Guardando…', 'Saving…') : t('Guardar', 'Save')}
        </button>
        {game.myRating && (
          <button className="btn btn-danger btn-sm" onClick={remove} disabled={saving}>
            {t('Quitar', 'Remove')}
          </button>
        )}
      </div>
    </div>
  )
}

/** Una reseña con sus botones de like / dislike. */
function ReviewItem({ review }: { review: Review }) {
  const { t, lang, locale } = useLang()
  const { user } = useAuth()
  const [votes, setVotes] = useState({ likes: review.likes, dislikes: review.dislikes, myVote: review.myVote })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMine = user?.userName.toLowerCase() === review.userName.toLowerCase()

  const vote = async (value: 1 | -1) => {
    if (!user || isMine || busy) return
    const next = votes.myVote === value ? 0 : value // volver a pulsar quita el voto
    setBusy(true)
    setError(null)
    try {
      setVotes(await api.voteReview(review.ratingId, next))
    } catch (e) {
      setError(e instanceof Error ? serverError(e.message, lang) : t('No se pudo votar.', "Couldn't vote."))
    } finally {
      setBusy(false)
    }
  }

  const canVote = Boolean(user) && !isMine
  const hint = !user
    ? t('Inicia sesión para votar', 'Log in to vote')
    : isMine
      ? t('Es tu reseña', 'This is your review')
      : undefined

  return (
    <article className="review">
      <Avatar name={review.userName} url={review.avatarUrl} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="review-head">
          <Link to={`/u/${review.userName}`}>
            <strong>{review.userName}</strong>
          </Link>
          <Stars value={review.score} size="0.9rem" />
          {review.platformName && <span className="tag platform-tag">{review.platformName}</span>}
          <span className="faint">{new Date(review.updatedAt).toLocaleDateString(locale)}</span>
        </div>
        {review.review && <p className="review-text">{review.review}</p>}
        {review.review && (
          <div className="review-votes" title={hint}>
            <button
              type="button"
              className={`vote-btn${votes.myVote === 1 ? ' active' : ''}`}
              onClick={() => vote(1)}
              disabled={!canVote || busy}
              aria-pressed={votes.myVote === 1}
              aria-label={t('Me gusta', 'Like')}
            >
              👍 {votes.likes}
            </button>
            <button
              type="button"
              className={`vote-btn dislike${votes.myVote === -1 ? ' active' : ''}`}
              onClick={() => vote(-1)}
              disabled={!canVote || busy}
              aria-pressed={votes.myVote === -1}
              aria-label={t('No me gusta', 'Dislike')}
            >
              👎 {votes.dislikes}
            </button>
            {error && (
              <span className="small" style={{ color: 'var(--danger)' }}>
                {error}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
