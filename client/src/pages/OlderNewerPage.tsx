import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Leader, OlderNewerGame, OlderNewerState } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { CountdownBar } from '../components/CountdownBar'
import { GameCover } from '../components/GameCard'
import { Leaderboard } from '../components/Leaderboard'
import { ErrorMessage } from '../components/Status'

type Phase = 'intro' | 'loading' | 'playing' | 'reveal' | 'over'
interface Reveal {
  correct: boolean
  year: number
  timedOut: boolean
}
interface Over {
  score: number
  best: number | null
  newRecord: boolean
  timedOut: boolean
}

/** Tiempo que se muestra el año revelado antes de pasar al siguiente juego. */
const REVEAL_MS = 1200

/**
 * Older/Newer: ¿el juego de la derecha salió antes o después que el de la izquierda?
 * La partida la lleva el servidor (el año a adivinar nunca llega al navegador antes de responder).
 */
export function OlderNewerPage() {
  const { user } = useAuth()
  const [phase, setPhase] = useState<Phase>('intro')
  const [run, setRun] = useState<OlderNewerState | null>(null)
  const [reveal, setReveal] = useState<Reveal | null>(null)
  const [over, setOver] = useState<Over | null>(null)
  const [leaders, setLeaders] = useState<Leader[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  // Ranking: al entrar y al terminar cada partida
  useEffect(() => {
    if (phase !== 'intro' && phase !== 'over') return
    let active = true
    api
      .olderNewerLeaderboard()
      .then((l) => active && setLeaders(l))
      .catch(() => active && setLeaders([]))
    return () => {
      active = false
    }
  }, [phase])

  const start = async () => {
    setError(null)
    setPhase('loading')
    try {
      setRun(await api.olderNewerStart())
      setReveal(null)
      setOver(null)
      setPhase('playing')
    } catch (err) {
      setError(err)
      setPhase('intro')
    }
  }

  const guess = async (choice: 'older' | 'newer' | 'timeout') => {
    if (!run || phase !== 'playing') return
    setPhase('reveal')
    setError(null)
    try {
      const res = await api.olderNewerGuess(run.runId, choice)
      setReveal({ correct: res.correct, year: res.rightYear, timedOut: res.timedOut })
      timer.current = window.setTimeout(() => {
        if (res.gameOver || !res.nextRight) {
          setOver({ score: res.score, best: res.best, newRecord: res.newRecord, timedOut: res.timedOut })
          setRun((r) => (r ? { ...r, score: res.score, best: res.best } : r))
          setPhase('over')
        } else {
          setRun((r) =>
            r
              ? { ...r, score: res.score, best: res.best, left: { ...r.right, year: res.rightYear }, right: res.nextRight! }
              : r,
          )
          setReveal(null)
          setPhase('playing')
        }
      }, REVEAL_MS)
    } catch (err) {
      setError(err)
      setPhase('playing')
    }
  }

  return (
    <div className="container page">
      <h1>Older / Newer</h1>
      <p className="muted page-intro">
        ¿El juego de la derecha salió <strong>antes</strong> o <strong>después</strong> que el de la izquierda? Cada
        acierto suma un punto. Tienes 10 segundos por pregunta. Al primer error, se acaba.
      </p>

      {error ? <ErrorMessage error={error} /> : null}

      {phase === 'intro' || (phase === 'loading' && !run) ? (
        <div className="on-intro card">
          <div className="on-intro-icons" aria-hidden="true">
            ⏪ 🎮 ⏩
          </div>
          {!user && (
            <p className="small muted" style={{ margin: 0 }}>
              Puedes jugar sin cuenta, pero <Link to="/login">inicia sesión</Link> para guardar tu récord en tu perfil.
            </p>
          )}
          <button className="btn btn-primary" onClick={start} disabled={phase === 'loading'}>
            {phase === 'loading' ? 'Preparando partida…' : 'Jugar'}
          </button>
        </div>
      ) : run ? (
        <>
          <div className="on-scorebar">
            <div>
              <span>Puntos</span>
              <strong>{run.score}</strong>
            </div>
            {run.best != null && (
              <div>
                <span>Tu récord</span>
                <strong>{Math.max(run.best, run.score)}</strong>
              </div>
            )}
          </div>

          {phase !== 'over' && (
            <CountdownBar
              seconds={run.secondsPerQuestion}
              resetKey={run.right.gameId}
              running={phase === 'playing'}
              onExpire={() => guess('timeout')}
            />
          )}
          {reveal?.timedOut && <p className="cq-feedback">⏰ ¡Se acabó el tiempo!</p>}

          <div className="on-board">
            <GameSide game={run.left} />
            <div className="on-vs" aria-hidden="true">
              VS
            </div>
            <GameSide
              game={run.right}
              revealedYear={reveal?.year}
              state={reveal ? (reveal.correct ? 'correct' : 'wrong') : undefined}
            >
              {phase === 'playing' && (
                <div className="on-buttons">
                  <button className="btn btn-primary" onClick={() => guess('older')}>
                    ⏪ Older
                    <small>Salió antes</small>
                  </button>
                  <button className="btn btn-primary" onClick={() => guess('newer')}>
                    Newer ⏩<small>Salió después</small>
                  </button>
                </div>
              )}
            </GameSide>
          </div>

          {phase === 'over' && over && (
            <div className="card on-over">
              <h2>{over.newRecord ? '🏆 ¡Nuevo récord!' : over.timedOut ? '⏰ Se acabó el tiempo' : 'Fin de la partida'}</h2>
              <p style={{ margin: 0 }}>
                Hiciste <strong>{over.score}</strong> {over.score === 1 ? 'punto' : 'puntos'}
                {over.best != null && !over.newRecord && <> · Tu récord: {over.best}</>}
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
        </>
      ) : null}

      {(phase === 'intro' || phase === 'over') && <Leaderboard leaders={leaders} />}
    </div>
  )
}

function GameSide({
  game,
  revealedYear,
  state,
  children,
}: {
  game: OlderNewerGame
  revealedYear?: number
  state?: 'correct' | 'wrong'
  children?: React.ReactNode
}) {
  const year = game.year ?? revealedYear
  return (
    <div className={`on-side${state ? ` ${state}` : ''}`}>
      <div className="on-cover">
        <GameCover src={game.coverUrl} name={game.name} />
      </div>
      <span className="on-name">{game.name}</span>
      <span className={`on-year${year == null ? ' hidden' : ''}`}>{year ?? '????'}</span>
      {children}
    </div>
  )
}
