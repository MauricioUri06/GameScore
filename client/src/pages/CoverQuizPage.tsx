import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { CoverQuizGuessResult, CoverQuizState, Leader } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { CountdownBar } from '../components/CountdownBar'
import { Leaderboard } from '../components/Leaderboard'
import { ErrorMessage } from '../components/Status'

type Phase = 'intro' | 'loading' | 'playing' | 'sending' | 'reveal' | 'over'

/**
 * "Adivina la portada": la portada sale borrosa (el servidor la difumina) y con el título oculto.
 * Cada intento fallido la aclara y revela letras. Menos intentos = más puntos. 30 s por ronda.
 */
export function CoverQuizPage() {
  const { user } = useAuth()
  const [phase, setPhase] = useState<Phase>('intro')
  const [state, setState] = useState<CoverQuizState | null>(null)
  const [result, setResult] = useState<CoverQuizGuessResult | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [leaders, setLeaders] = useState<Leader[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (phase !== 'intro' && phase !== 'over') return
    let active = true
    api
      .coverQuizLeaderboard()
      .then((l) => active && setLeaders(l))
      .catch(() => active && setLeaders([]))
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
      setFeedback(`"${text.trim()}" no es. ¡La portada se aclara un poco!`)
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
      <h1>Adivina la portada</h1>
      <p className="muted page-intro">
        Escribe el nombre del juego. Cada error aclara la portada y revela letras, pero vale menos puntos. Tienes{' '}
        {state?.secondsPerRound ?? 30} segundos por portada.
      </p>
      {error ? <ErrorMessage error={error} /> : null}

      {phase === 'intro' || (phase === 'loading' && !state) ? (
        <div className="on-intro card">
          <div className="on-intro-icons" aria-hidden="true">
            🖼️ ❓
          </div>
          <p className="small muted" style={{ margin: 0 }}>
            10 portadas · 4 intentos cada una · 100, 70, 40 o 20 puntos según el intento.
          </p>
          {!user && (
            <p className="small muted" style={{ margin: 0 }}>
              Puedes jugar sin cuenta, pero <Link to="/login">inicia sesión</Link> para guardar tu récord.
            </p>
          )}
          <button className="btn btn-primary" onClick={start} disabled={phase === 'loading'}>
            {phase === 'loading' ? 'Preparando partida…' : 'Jugar'}
          </button>
        </div>
      ) : state && phase !== 'over' ? (
        <div className="cq-board">
          <div className="on-scorebar">
            <div>
              <span>Portada</span>
              <strong>
                {state.round}/{state.totalRounds}
              </strong>
            </div>
            <div>
              <span>Puntos</span>
              <strong>{state.score}</strong>
            </div>
            {state.best != null && (
              <div>
                <span>Tu récord</span>
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
            <img src={state.imageUrl} alt="Portada a adivinar" draggable={false} />
          </div>

          <p className="cq-hint" aria-label="Pista del título">
            {state.hint}
          </p>

          {phase === 'reveal' && result ? (
            <div className="cq-result">
              <h2>
                {result.correct
                  ? `✅ ¡Correcto! +${result.points}`
                  : result.timedOut
                    ? '⏰ Se acabó el tiempo'
                    : 'Era…'}
              </h2>
              {result.answerGameId != null && (
                <Link to={`/games/${result.answerGameId}`} target="_blank" rel="noreferrer">
                  {result.answer}
                </Link>
              )}
              <button className="btn btn-primary" onClick={next} autoFocus>
                {state.gameOver ? 'Ver resultado' : 'Siguiente portada →'}
              </button>
            </div>
          ) : (
            <>
              <div className="cq-attempts" aria-label={`Intento ${state.attempts + 1} de ${state.maxAttempts}`}>
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
                  placeholder="Nombre del juego…"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={200}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={phase === 'sending'}
                />
                <button className="btn btn-primary" disabled={phase === 'sending' || !text.trim()}>
                  Adivinar ({pointsNow} pts)
                </button>
              </form>
              <button type="button" className="link-button small" onClick={skip} disabled={phase === 'sending'}>
                Me rindo, mostrar la respuesta
              </button>
            </>
          )}
        </div>
      ) : null}

      {phase === 'over' && state && (
        <div className="card on-over">
          <h2>{result?.newRecord ? '🏆 ¡Nuevo récord!' : 'Fin de la partida'}</h2>
          <p style={{ margin: 0 }}>
            Hiciste <strong>{state.score}</strong> de {state.totalRounds * state.pointsByAttempt[0]} puntos
            {state.best != null && !result?.newRecord && <> · Tu récord: {Math.max(state.best, state.score)}</>}
          </p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={start}>
              Jugar de nuevo
            </button>
            {user && (
              <Link to={`/u/${user.userName}`} className="btn btn-ghost">
                Ver mi perfil
              </Link>
            )}
          </div>
        </div>
      )}

      {(phase === 'intro' || phase === 'over') && <Leaderboard leaders={leaders} />}
    </div>
  )
}
