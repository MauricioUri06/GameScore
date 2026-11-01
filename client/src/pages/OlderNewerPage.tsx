import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Leader, OlderNewerGame, OlderNewerState } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { CountdownBar } from '../components/CountdownBar'
import { GameCover } from '../components/GameCard'
import { Leaderboard } from '../components/Leaderboard'
import { ErrorMessage } from '../components/Status'
import { useLang } from '../i18n/LanguageContext'

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
  const { t } = useLang()
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
              ? {
                  ...r,
                  score: res.score,
                  best: res.best,
                  left: { ...r.right, year: res.rightYear },
                  right: res.nextRight!,
                }
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
        {t(
          '¿El juego de la derecha salió antes o después que el de la izquierda? Cada acierto suma un punto. Tienes 10 segundos por pregunta. Al primer error, se acaba.',
          'Was the game on the right released before or after the one on the left? Each correct answer is a point. You have 10 seconds per question. One mistake and it’s over.',
        )}
      </p>

      {error ? <ErrorMessage error={error} /> : null}

      {phase === 'intro' || (phase === 'loading' && !run) ? (
        <div className="on-intro card">
          <div className="on-intro-icons" aria-hidden="true">
            ⏪ 🎮 ⏩
          </div>
          {!user && (
            <p className="small muted" style={{ margin: 0 }}>
              {t('Puedes jugar sin cuenta, pero', 'You can play without an account, but')}{' '}
              <Link to="/login">{t('inicia sesión', 'log in')}</Link>{' '}
              {t('para guardar tu récord', 'to save your record')} {t('en tu perfil.', 'on your profile.')}
            </p>
          )}
          <button className="btn btn-primary" onClick={start} disabled={phase === 'loading'}>
            {phase === 'loading' ? t('Preparando partida…', 'Getting the game ready…') : t('Jugar', 'Play')}
          </button>
        </div>
      ) : run ? (
        <>
          <div className="on-scorebar">
            <div>
              <span>{t('Puntos', 'Points')}</span>
              <strong>{run.score}</strong>
            </div>
            {run.best != null && (
              <div>
                <span>{t('Tu récord', 'Your record')}</span>
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
          {reveal?.timedOut && <p className="cq-feedback">⏰ {t('¡Se acabó el tiempo!', "Time's up!")}</p>}

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
                    <small>{t('Salió antes', 'Came out earlier')}</small>
                  </button>
                  <button className="btn btn-primary" onClick={() => guess('newer')}>
                    Newer ⏩<small>{t('Salió después', 'Came out later')}</small>
                  </button>
                </div>
              )}
            </GameSide>
          </div>

          {phase === 'over' && over && (
            <div className="card on-over">
              <h2>
                {over.newRecord
                  ? t('🏆 ¡Nuevo récord!', '🏆 New record!')
                  : over.timedOut
                    ? t('⏰ Se acabó el tiempo', "⏰ Time's up")
                    : t('Fin de la partida', 'Game over')}
              </h2>
              <p style={{ margin: 0 }}>
                {t('Hiciste', 'You scored')} <strong>{over.score}</strong>{' '}
                {over.score === 1 ? t('punto', 'point') : t('puntos', 'points')}
                {over.best != null && !over.newRecord && (
                  <>
                    {' '}
                    · {t('Tu récord', 'Your record')}: {over.best}
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
