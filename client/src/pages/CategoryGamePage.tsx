import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { CategoryAnswerResult, CategoryState, GameSummary, Leader } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { CountdownBar } from '../components/CountdownBar'
import { GamePicker } from '../components/GamePicker'
import { Leaderboard } from '../components/Leaderboard'
import { ErrorMessage } from '../components/Status'

type Phase = 'intro' | 'loading' | 'playing' | 'sending' | 'reveal' | 'over'

const formatSeconds = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/**
 * "Categorías" (1 jugador): sale una categoría y hay que elegir un juego que la tenga.
 * Más rápido = más puntos (100 → 10 en 30 s). Meta: 1000 puntos. 3 vidas.
 * El récord es el menor tiempo total para llegar a 1000.
 */
export function CategoryGamePage() {
  const { user } = useAuth()
  const [phase, setPhase] = useState<Phase>('intro')
  const [state, setState] = useState<CategoryState | null>(null)
  const [result, setResult] = useState<CategoryAnswerResult | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [leaders, setLeaders] = useState<Leader[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [roundStart, setRoundStart] = useState(0)
  const [now, setNow] = useState(0)

  useEffect(() => {
    if (phase !== 'intro' && phase !== 'over') return
    let active = true
    api
      .categoryLeaderboard()
      .then((l) => active && setLeaders(l))
      .catch(() => active && setLeaders([]))
    return () => {
      active = false
    }
  }, [phase])

  // Reloj para mostrar cuántos puntos vale responder ahora
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'sending') return
    const id = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [phase])

  const beginRound = (s: CategoryState) => {
    setState(s)
    setResult(null)
    setNotice(null)
    const t = Date.now()
    setRoundStart(t)
    setNow(t)
    setPhase('playing')
  }

  const start = async () => {
    setError(null)
    setPhase('loading')
    try {
      beginRound(await api.categoryStart())
    } catch (err) {
      setError(err)
      setPhase('intro')
    }
  }

  const show = (res: CategoryAnswerResult) => {
    setState(res.state)
    setResult(res)
    setPhase('reveal')
  }

  const answer = async (game: GameSummary) => {
    if (!state || phase !== 'playing') return
    setPhase('sending')
    setError(null)
    setNotice(null)
    try {
      const res = await api.categoryAnswer(state.runId, game.gameId)
      if (res.alreadyUsed) {
        setNotice(`Ya usaste ${game.name} en esta partida. ¡Elige otro!`)
        setPhase('playing')
      } else {
        show(res)
      }
    } catch (err) {
      setError(err)
      setPhase('playing')
    }
  }

  const timeout = async () => {
    if (!state || (phase !== 'playing' && phase !== 'sending')) return
    setPhase('sending')
    try {
      show(await api.categoryTimeout(state.runId))
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
      beginRound(await api.categoryNext(state.runId))
    } catch (err) {
      setError(err)
    }
  }

  const pointsNow = state
    ? Math.round(
        state.maxPoints -
          ((state.maxPoints - state.minPoints) * Math.min(state.secondsPerRound, (now - roundStart) / 1000)) /
            state.secondsPerRound,
      )
    : 0

  return (
    <div className="container page">
      <h1>Categorías</h1>
      <p className="muted page-intro">
        Sale una categoría: elige un juego que la tenga. Cuanto más rápido respondas, más puntos. Llega a 1000 antes de
        perder tus 3 vidas.
      </p>
      {error ? <ErrorMessage error={error} /> : null}

      {phase === 'intro' || (phase === 'loading' && !state) ? (
        <div className="on-intro card">
          <div className="on-intro-icons" aria-hidden="true">
            📚 ⏱️
          </div>
          <p className="small muted" style={{ margin: 0 }}>
            30 segundos por categoría · de 100 a 10 puntos según la rapidez · un juego equivocado o el tiempo agotado
            te quita una vida · no se pueden repetir juegos.
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
              <span>Puntos</span>
              <strong>
                {state.score}
                <small className="cat-goal">/{state.goal}</small>
              </strong>
            </div>
            <div>
              <span>Vidas</span>
              <strong className="cat-lives" aria-label={`${state.lives} de ${state.maxLives} vidas`}>
                {Array.from({ length: state.maxLives }, (_, i) => (i < state.lives ? '❤️' : '🖤')).join('')}
              </strong>
            </div>
            <div>
              <span>Ronda</span>
              <strong>{state.round}</strong>
            </div>
          </div>
          <div className="cat-progress" aria-hidden="true">
            <span style={{ width: `${Math.min(100, (state.score / state.goal) * 100)}%` }} />
          </div>

          <CountdownBar
            seconds={state.secondsPerRound}
            resetKey={`${state.runId}-${state.round}`}
            running={phase === 'playing' || phase === 'sending'}
            onExpire={timeout}
          />

          <div className="cat-category">
            <span>Un juego de…</span>
            <strong>{state.category}</strong>
          </div>

          {phase === 'reveal' && result ? (
            <div className="cq-result">
              <h2>
                {result.correct
                  ? `✅ ¡Sí! +${result.points}`
                  : result.timedOut
                    ? '⏰ Se acabó el tiempo · −1 vida'
                    : '❌ No es de esa categoría · −1 vida'}
              </h2>
              {result.gameName && result.gameId != null && (
                <Link to={`/games/${result.gameId}`} target="_blank" rel="noreferrer">
                  {result.gameName}
                </Link>
              )}
              <button className="btn btn-primary" onClick={next} autoFocus>
                {state.gameOver ? 'Ver resultado' : 'Siguiente categoría →'}
              </button>
            </div>
          ) : (
            <>
              <p className="cq-feedback">Vale {pointsNow} puntos ahora</p>
              {notice && <p className="cq-feedback">{notice}</p>}
              <GamePicker
                onPick={answer}
                disabled={phase === 'sending'}
                autoFocus
                placeholder="Escribe y elige un juego…"
              />
            </>
          )}
        </div>
      ) : null}

      {phase === 'over' && state && (
        <div className="card on-over">
          {state.won ? (
            <>
              <h2>{result?.newRecord ? '🏆 ¡Nuevo récord!' : '📚 ¡Llegaste a 1000!'}</h2>
              <p style={{ margin: 0 }}>
                Tiempo total: <strong>{formatSeconds(state.totalSeconds)}</strong> en {state.round} rondas
                {state.bestSeconds != null && !result?.newRecord && <> · Tu récord: {formatSeconds(state.bestSeconds)}</>}
              </p>
            </>
          ) : (
            <>
              <h2>Sin vidas</h2>
              <p style={{ margin: 0 }}>
                Llegaste a <strong>{state.score}</strong> de {state.goal} puntos.
              </p>
            </>
          )}
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

      {(phase === 'intro' || phase === 'over') && (
        <Leaderboard leaders={leaders} format={formatSeconds} title="Mejores tiempos para llegar a 1000" />
      )}
    </div>
  )
}
