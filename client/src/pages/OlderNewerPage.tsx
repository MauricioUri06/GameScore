import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { OlderNewerGame, OlderNewerLeader, OlderNewerState } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Avatar } from '../components/Avatar'
import { GameCover } from '../components/GameCard'
import { ErrorMessage } from '../components/Status'

type Phase = 'intro' | 'loading' | 'playing' | 'reveal' | 'over'
interface Reveal {
  correct: boolean
  year: number
}
interface Over {
  score: number
  best: number | null
  newRecord: boolean
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
  const [leaders, setLeaders] = useState<OlderNewerLeader[] | null>(null)
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

  const guess = async (choice: 'older' | 'newer') => {
    if (!run || phase !== 'playing') return
    setPhase('reveal')
    setError(null)
    try {
      const res = await api.olderNewerGuess(run.runId, choice)
      setReveal({ correct: res.correct, year: res.rightYear })
      timer.current = window.setTimeout(() => {
        if (res.gameOver || !res.nextRight) {
          setOver({ score: res.score, best: res.best, newRecord: res.newRecord })
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
        acierto suma un punto. Al primer error, se acaba.
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
              <h2>{over.newRecord ? '🏆 ¡Nuevo récord!' : 'Fin de la partida'}</h2>
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

      {(phase === 'intro' || phase === 'over') && (
        <section className="section">
          <div className="section-header">
            <h2>Mejores récords</h2>
          </div>
          {leaders === null ? null : leaders.length === 0 ? (
            <p className="muted" style={{ textAlign: 'center' }}>
              Nadie tiene récord todavía. ¡Sé el primero!
            </p>
          ) : (
            <ol className="on-leaders">
              {leaders.map((l, i) => (
                <li key={l.userName}>
                  <span className="on-rank">#{i + 1}</span>
                  <Link to={`/u/${l.userName}`} className="on-leader-user">
                    <Avatar name={l.userName} url={l.avatarUrl} />
                    {l.userName}
                  </Link>
                  <strong>{l.best}</strong>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
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
