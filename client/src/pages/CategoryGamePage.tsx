import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { CategoryAnswerResult, CategoryState, GameSummary, Leader } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { CountdownBar } from '../components/CountdownBar'
import { GamePicker } from '../components/GamePicker'
import { Leaderboard } from '../components/Leaderboard'
import { ErrorMessage } from '../components/Status'
import { useLang } from '../i18n/LanguageContext'
import { genreName } from '../i18n/serverText'

type Phase = 'intro' | 'loading' | 'playing' | 'sending' | 'reveal' | 'over'

const formatSeconds = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/**
 * "Categorías" (1 jugador): sale una categoría y hay que elegir un juego que la tenga.
 * Más rápido = más puntos (100 → 10 en 30 s). Meta: 1000 puntos. 3 vidas.
 * El récord es el menor tiempo total para llegar a 1000.
 */
export function CategoryGamePage() {
  const { user } = useAuth()
  const { t, lang } = useLang()
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
        setNotice(
          t(
            `Ya usaste ${game.name} en esta partida. ¡Elige otro!`,
            `You already used ${game.name} this game. Pick another!`,
          ),
        )
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
      <h1>{t('Categorías', 'Categories')}</h1>
      <p className="muted page-intro">
        {t(
          'Sale una categoría: elige un juego que la tenga. Cuanto más rápido respondas, más puntos. Llega a 1000 antes de perder tus 3 vidas.',
          'A category appears: pick a game that has it. The faster you answer, the more points. Reach 1000 before losing your 3 lives.',
        )}
      </p>
      {error ? <ErrorMessage error={error} /> : null}

      {phase === 'intro' || (phase === 'loading' && !state) ? (
        <div className="on-intro card">
          <div className="on-intro-icons" aria-hidden="true">
            📚 ⏱️
          </div>
          <p className="small muted" style={{ margin: 0 }}>
            {t(
              '30 segundos por categoría · de 100 a 10 puntos según la rapidez · un juego equivocado o el tiempo agotado te quita una vida · no se pueden repetir juegos.',
              '30 seconds per category · 100 to 10 points depending on speed · a wrong game or running out of time costs a life · no repeating games.',
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
              <span>{t('Puntos', 'Points')}</span>
              <strong>
                {state.score}
                <small className="cat-goal">/{state.goal}</small>
              </strong>
            </div>
            <div>
              <span>{t('Vidas', 'Lives')}</span>
              <strong
                className="cat-lives"
                aria-label={t(`${state.lives} de ${state.maxLives} vidas`, `${state.lives} of ${state.maxLives} lives`)}
              >
                {Array.from({ length: state.maxLives }, (_, i) => (i < state.lives ? '❤️' : '🖤')).join('')}
              </strong>
            </div>
            <div>
              <span>{t('Ronda', 'Round')}</span>
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
            <span>{t('Un juego de…', 'A game of…')}</span>
            <strong>{genreName(state.category, lang)}</strong>
          </div>

          {phase === 'reveal' && result ? (
            <div className="cq-result">
              <h2>
                {result.correct
                  ? t(`✅ ¡Sí! +${result.points}`, `✅ Yes! +${result.points}`)
                  : result.timedOut
                    ? t('⏰ Se acabó el tiempo · −1 vida', "⏰ Time's up · −1 life")
                    : t('❌ No es de esa categoría · −1 vida', '❌ Not in that category · −1 life')}
              </h2>
              {result.gameName && result.gameId != null && (
                <Link to={`/games/${result.gameId}`} target="_blank" rel="noreferrer">
                  {result.gameName}
                </Link>
              )}
              <button className="btn btn-primary" onClick={next} autoFocus>
                {state.gameOver ? t('Ver resultado', 'See result') : t('Siguiente categoría →', 'Next category →')}
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
                placeholder={t('Escribe y elige un juego…', 'Type and pick a game…')}
              />
            </>
          )}
        </div>
      ) : null}

      {phase === 'over' && state && (
        <div className="card on-over">
          {state.won ? (
            <>
              <h2>
                {result?.newRecord
                  ? t('🏆 ¡Nuevo récord!', '🏆 New record!')
                  : t('📚 ¡Llegaste a 1000!', '📚 You reached 1000!')}
              </h2>
              <p style={{ margin: 0 }}>
                {t('Tiempo total', 'Total time')}: <strong>{formatSeconds(state.totalSeconds)}</strong>{' '}
                {t(`en ${state.round} rondas`, `in ${state.round} rounds`)}
                {state.bestSeconds != null && !result?.newRecord && (
                  <>
                    {' '}
                    · {t('Tu récord', 'Your record')}: {formatSeconds(state.bestSeconds)}
                  </>
                )}
              </p>
            </>
          ) : (
            <>
              <h2>{t('Sin vidas', 'Out of lives')}</h2>
              <p style={{ margin: 0 }}>
                {t('Llegaste a', 'You reached')} <strong>{state.score}</strong> {t('de', 'of')} {state.goal}{' '}
                {t('puntos', 'points')}.
              </p>
            </>
          )}
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

      {(phase === 'intro' || phase === 'over') && (
        <Leaderboard
          leaders={leaders}
          format={formatSeconds}
          title={t('Mejores tiempos para llegar a 1000', 'Fastest times to reach 1000')}
        />
      )}
    </div>
  )
}
