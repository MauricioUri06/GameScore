import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { CoverQuizGuessResult, CoverQuizState, LeaderboardData } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { CountdownBar } from '../components/CountdownBar'
import { Leaderboard } from '../components/Leaderboard'
import { ErrorMessage } from '../components/Status'
import { useLang } from '../i18n/LanguageContext'

type Phase = 'intro' | 'loading' | 'playing' | 'sending' | 'reveal' | 'over'

/**
 * "Adivina la portada": la portada sale borrosa (el servidor la difumina) y con el título oculto.
 * Cada intento fallido la aclara y revela letras. Menos intentos = más puntos. 30 s por ronda.
 */
export function CoverQuizPage() {
  const { user } = useAuth()
  const { t } = useLang()
  const [phase, setPhase] = useState<Phase>('intro')
  const [state, setState] = useState<CoverQuizState | null>(null)
  const [result, setResult] = useState<CoverQuizGuessResult | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [leaders, setLeaders] = useState<LeaderboardData | null>(null)
  const [error, setError] = useState<unknown>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (phase !== 'intro' && phase !== 'over') return
    let active = true
    api
      .coverQuizLeaderboard()
      .then((l) => active && setLeaders(l))
      .catch(() => active && setLeaders({ top: [], me: null }))
    return () => {
      active = false
    }
  }, [phase])

  useEffect(() => {
    if (phase === 'playing') input.current?.focus()
  }, [phase, state?.round, state?.attempts])

  const start = async () => {
    setError(null)
    setPhase('loading')
    try {
      setState(await api.coverQuizStart())
      setResult(null)
      setFeedback(null)
      setText('')
      setPhase('playing')
    } catch (err) {
      setError(err)
      setPhase('intro')
    }
  }

  const apply = (res: CoverQuizGuessResult) => {
    setState(res.state)
    if (res.state.roundOver || res.state.gameOver) {
      setResult(res)
      setFeedback(null)
      setPhase('reveal')
    } else {
      setFeedback(
        t(
          `"${text.trim()}" no es. ¡La portada se aclara un poco!`,
          `"${text.trim()}" is not it. The cover gets a bit clearer!`,
        ),
      )
      setText('')
      setPhase('playing')
    }
  }

  const guess = async (e: FormEvent) => {
    e.preventDefault()
    if (!state || phase !== 'playing' || !text.trim()) return
    setPhase('sending')
    setError(null)
    try {
      apply(await api.coverQuizGuess(state.runId, text.trim()))
    } catch (err) {
      setError(err)
      setPhase('playing')
    }
  }

  const skip = async () => {
    if (!state || (phase !== 'playing' && phase !== 'sending')) return
    setPhase('sending')
    try {
      apply(await api.coverQuizSkip(state.runId))
    } catch (err) {
      setError(err)
      setPhase('playing')
    }
  }

  const next = async () => {
    if (!state) return
    if (state.gameOver) return setPhase('over')
    setError(null)
    try {
      setState(await api.coverQuizNext(state.runId))
      setResult(null)
      setFeedback(null)
      setText('')
      setPhase('playing')
    } catch (err) {
      setError(err)
    }
  }

  const pointsNow = state ? (state.pointsByAttempt[state.attempts] ?? 0) : 0

  return (
    <div className="container page">
      <h1>{t('Adivina la portada', 'Guess the Cover')}</h1>
      <p className="muted page-intro">
        {t(
          `Escribe el nombre del juego. Cada error aclara la portada y revela letras, pero vale menos puntos. Tienes ${state?.secondsPerRound ?? 30} segundos por portada.`,
          `Type the game's name. Each mistake makes the cover clearer and reveals letters, but it's worth fewer points. You have ${state?.secondsPerRound ?? 30} seconds per cover.`,
        )}
      </p>
      {error ? <ErrorMessage error={error} /> : null}

      {phase === 'intro' || (phase === 'loading' && !state) ? (
        <div className="on-intro card">
          <div className="on-intro-icons" aria-hidden="true">
            🖼️ ❓
          </div>
          <p className="small muted" style={{ margin: 0 }}>
            {t(
              '10 portadas · 4 intentos cada una · 100, 70, 40 o 20 puntos según el intento.',
              '10 covers · 4 tries each · 100, 70, 40 or 20 points depending on the try.',
            )}
          </p>
          {!user && (
            <p className="small muted" style={{ margin: 0 }}>
              {t('Puedes jugar sin cuenta, pero', 'You can play without an account, but')}{' '}
              <Link to="/login">{t('inicia sesión', 'log in')}</Link>{' '}
              {t('para guardar tu récord', 'to save your record')}.
            </p>
          )}
          <button className="btn btn-primary" onClick={start} disabled={phase === 'loading'}>
            {phase === 'loading' ? t('Preparando partida…', 'Getting the game ready…') : t('Jugar', 'Play')}
          </button>
        </div>
      ) : state && phase !== 'over' ? (
        <div className="cq-board">
          <div className="on-scorebar">
            <div>
              <span>{t('Portada', 'Cover')}</span>
              <strong>
                {state.round}/{state.totalRounds}
              </strong>
            </div>
            <div>
              <span>{t('Puntos', 'Points')}</span>
              <strong>{state.score}</strong>
            </div>
            {state.best != null && (
              <div>
                <span>{t('Tu récord', 'Your record')}</span>
                <strong>{Math.max(state.best, state.score)}</strong>
              </div>
            )}
          </div>

          <CountdownBar
            seconds={state.secondsPerRound}
            resetKey={`${state.runId}-${state.round}`}
            running={phase === 'playing' || phase === 'sending'}
            onExpire={skip}
          />

          <div className={`cq-cover${phase === 'reveal' ? (result?.correct ? ' correct' : ' wrong') : ''}`}>
            <img src={state.imageUrl} alt={t('Portada a adivinar', 'Cover to guess')} draggable={false} />
          </div>

          <p className="cq-hint" aria-label={t('Pista del título', 'Title hint')}>
            {state.hint}
          </p>

          {phase === 'reveal' && result ? (
            <div className="cq-result">
              <h2>
                {result.correct
                  ? t(`✅ ¡Correcto! +${result.points}`, `✅ Correct! +${result.points}`)
                  : result.timedOut
                    ? t('⏰ Se acabó el tiempo', "⏰ Time's up")
                    : t('Era…', 'It was…')}
              </h2>
              {result.answerGameId != null && (
                <Link to={`/games/${result.answerGameId}`} target="_blank" rel="noreferrer">
                  {result.answer}
                </Link>
              )}
              <button className="btn btn-primary" onClick={next} autoFocus>
                {state.gameOver ? t('Ver resultado', 'See result') : t('Siguiente portada →', 'Next cover →')}
              </button>
            </div>
          ) : (
            <>
              <div
                className="cq-attempts"
                aria-label={t(
                  `Intento ${state.attempts + 1} de ${state.maxAttempts}`,
                  `Try ${state.attempts + 1} of ${state.maxAttempts}`,
                )}
              >
                {state.pointsByAttempt.map((p, i) => (
                  <span key={p} className={i < state.attempts ? 'used' : i === state.attempts ? 'current' : ''}>
                    {p}
                  </span>
                ))}
              </div>
              {feedback && <p className="cq-feedback">{feedback}</p>}
              <form className="cq-form" onSubmit={guess}>
                <input
                  ref={input}
                  className="input"
                  placeholder={t('Nombre del juego…', 'Game name…')}
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={200}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={phase === 'sending'}
                />
                <button className="btn btn-primary" disabled={phase === 'sending' || !text.trim()}>
                  {t('Adivinar', 'Guess')} ({pointsNow} pts)
                </button>
              </form>
              <button type="button" className="link-button small" onClick={skip} disabled={phase === 'sending'}>
                {t('Me rindo, mostrar la respuesta', 'I give up, show the answer')}
              </button>
            </>
          )}
        </div>
      ) : null}

      {phase === 'over' && state && (
        <div className="card on-over">
          <h2>{result?.newRecord ? t('🏆 ¡Nuevo récord!', '🏆 New record!') : t('Fin de la partida', 'Game over')}</h2>
          <p style={{ margin: 0 }}>
            {t('Hiciste', 'You scored')} <strong>{state.score}</strong> {t('de', 'of')}{' '}
            {state.totalRounds * state.pointsByAttempt[0]} {t('puntos', 'points')}
            {state.best != null && !result?.newRecord && (
              <>
                {' '}
                · {t('Tu récord', 'Your record')}: {Math.max(state.best, state.score)}
              </>
            )}
          </p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={start}>
              {t('Jugar de nuevo', 'Play again')}
            </button>
            {user && (
              <Link to={`/u/${user.userName}`} className="btn btn-ghost">
                {t('Ver mi perfil', 'View my profile')}
              </Link>
            )}
          </div>
        </div>
      )}

      {(phase === 'intro' || phase === 'over') && <Leaderboard board={leaders} />}
    </div>
  )
}
