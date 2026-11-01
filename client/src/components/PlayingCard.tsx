import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { JournalEntry, PlayingGame } from '../api/types'
import { GameCover } from './GameCard'
import { ErrorMessage } from './Status'
import { useLang } from '../i18n/LanguageContext'

const formatHours = (h: number) => `${Number.isInteger(h) ? h : h.toFixed(1)} h`
const round1 = (n: number) => Math.round(n * 10) / 10

/**
 * Juego de "Jugando ahora": portada, descripción, diario (lo último que hizo el jugador)
 * y horas jugadas. Si es tu perfil puedes escribir en el diario y sumar horas.
 */
export function PlayingCard({
  game,
  userName,
  isMe,
  onFinished,
}: {
  game: PlayingGame
  userName: string
  isMe: boolean
  onFinished?: (gameId: number) => void
}) {
  const [hours, setHours] = useState(game.hoursPlayed)
  const { t, locale } = useLang()
  const dateFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' })
  const [lastEntry, setLastEntry] = useState<JournalEntry | null>(game.lastEntry)
  const [count, setCount] = useState(game.journalCount)
  const [history, setHistory] = useState<JournalEntry[] | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [expanded, setExpanded] = useState(false)
  const [confirmFinish, setConfirmFinish] = useState(false)
  const [finishing, setFinishing] = useState(false)

  const finish = async () => {
    setFinishing(true)
    setError(null)
    try {
      await api.finishPlaying(game.gameId)
      onFinished?.(game.gameId)
    } catch (err) {
      setError(err)
      setFinishing(false)
      setConfirmFinish(false)
    }
  }

  // Los clics rápidos se juntan y se mandan en UNA sola petición cuando el usuario para de hacer clic.
  // Así las respuestas nunca llegan desordenadas y el número no "retrocede".
  const pending = useRef(0) // horas sumadas en pantalla que aún no se enviaron
  const flushTimer = useRef<number | undefined>(undefined)
  const sending = useRef(false)

  const flushHours = async () => {
    window.clearTimeout(flushTimer.current)
    if (sending.current || pending.current === 0) return
    const delta = pending.current
    pending.current = 0
    sending.current = true
    try {
      const res = await api.addPlayingHours(game.gameId, delta)
      // Lo que diga el servidor + lo que se haya clicado mientras tanto
      setHours(Math.max(0, round1(res.hoursPlayed + pending.current)))
    } catch (err) {
      setHours((h) => Math.max(0, round1(h - delta)))
      setError(err)
    } finally {
      sending.current = false
      if (pending.current !== 0) flushTimer.current = window.setTimeout(flushHours, 400)
    }
  }

  // Si sales de la página con horas sin enviar, se envían igual
  const flushRef = useRef(flushHours)
  useEffect(() => {
    flushRef.current = flushHours
  })
  useEffect(() => () => void flushRef.current(), [])

  const addHours = (delta: number) => {
    setError(null)
    const next = Math.max(0, round1(hours + delta))
    const applied = round1(next - hours)
    if (applied === 0) return
    pending.current = round1(pending.current + applied)
    setHours(next) // respuesta inmediata en pantalla
    window.clearTimeout(flushTimer.current)
    if (Math.abs(pending.current) >= 50) void flushHours()
    else flushTimer.current = window.setTimeout(flushHours, 600)
  }

  const addEntry = async (e: FormEvent) => {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    setBusy(true)
    setError(null)
    try {
      const entry = await api.addJournalEntry(game.gameId, value)
      setLastEntry(entry)
      setCount((c) => c + 1)
      setHistory((h) => (h ? [entry, ...h] : h))
      setText('')
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const toggleHistory = async () => {
    if (showHistory) return setShowHistory(false)
    setShowHistory(true)
    if (history) return
    try {
      setHistory(await api.journal(userName, game.gameId))
    } catch (err) {
      setError(err)
    }
  }

  const removeEntry = async (id: number) => {
    setError(null)
    try {
      await api.deleteJournalEntry(id)
      const rest = (history ?? []).filter((x) => x.id !== id)
      setHistory(rest)
      setCount((c) => Math.max(0, c - 1))
      if (lastEntry?.id === id) setLastEntry(rest[0] ?? null)
    } catch (err) {
      setError(err)
    }
  }

  return (
    <article className="card playing-card">
      <Link to={`/games/${game.gameId}`} className="playing-cover">
        <GameCover src={game.coverUrl} name={game.name} />
      </Link>

      <div className="playing-body">
        <div className="playing-head">
          <Link to={`/games/${game.gameId}`} className="playing-title">
            {game.name}
          </Link>
          {isMe &&
            (confirmFinish ? (
              <span className="playing-finish-confirm">
                <span className="small muted">{t('¿Lo terminaste?', 'Did you finish it?')}</span>
                <button type="button" className="btn btn-primary btn-sm" onClick={finish} disabled={finishing}>
                  {finishing ? t('Moviendo…', 'Moving…') : t('Sí, terminado', 'Yes, finished')}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setConfirmFinish(false)}
                  disabled={finishing}
                >
                  {t('Cancelar', 'Cancel')}
                </button>
              </span>
            ) : (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmFinish(true)}>
                🏁 {t('Marcar como terminado', 'Mark as finished')}
              </button>
            ))}
        </div>
        {game.description ? (
          <>
            <p className={`playing-description${expanded ? ' expanded' : ''}`}>{game.description}</p>
            {game.description.length > 260 && (
              <button type="button" className="link-button small" onClick={() => setExpanded(!expanded)}>
                {expanded ? t('Ver menos', 'Show less') : t('Ver más', 'Show more')}
              </button>
            )}
          </>
        ) : (
          <p className="faint small">{t('Sin descripción.', 'No description.')}</p>
        )}

        {error ? <ErrorMessage error={error} /> : null}

        <div className="playing-tracker">
          <div className="playing-journal">
            <h3>{t('Diario', 'Journal')}</h3>
            {lastEntry ? (
              <div className="journal-entry latest">
                <span className="journal-date">{dateFmt.format(new Date(lastEntry.createdAt))}</span>
                <p>{lastEntry.text}</p>
              </div>
            ) : (
              <p className="faint small" style={{ margin: 0 }}>
                {isMe
                  ? t('¿Qué hiciste en tu última partida?', 'What did you do in your last session?')
                  : t('Todavía no escribió nada.', "Hasn't written anything yet.")}
              </p>
            )}

            {isMe && (
              <form className="journal-form" onSubmit={addEntry}>
                <textarea
                  className="textarea"
                  maxLength={500}
                  placeholder={t(
                    'Ej.: Derroté al jefe del capítulo 3 y desbloqueé el doble salto.',
                    'E.g.: Beat the chapter 3 boss and unlocked the double jump.',
                  )}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <div className="journal-form-actions">
                  <span className="faint small">{text.length}/500</span>
                  <button className="btn btn-primary btn-sm" disabled={busy || !text.trim()}>
                    {busy ? t('Guardando…', 'Saving…') : t('Anotar', 'Add entry')}
                  </button>
                </div>
              </form>
            )}

            {count > 1 && (
              <button type="button" className="link-button small" onClick={toggleHistory}>
                {showHistory
                  ? t('Ocultar diario', 'Hide journal')
                  : t(`Ver diario completo (${count})`, `See full journal (${count})`)}
              </button>
            )}
            {showHistory && history && (
              <ul className="journal-history">
                {history.map((entry) => (
                  <li key={entry.id} className="journal-entry">
                    <span className="journal-date">{dateFmt.format(new Date(entry.createdAt))}</span>
                    <p>{entry.text}</p>
                    {isMe && (
                      <button
                        type="button"
                        className="journal-delete"
                        aria-label={t('Borrar entrada', 'Delete entry')}
                        title={t('Borrar entrada', 'Delete entry')}
                        onClick={() => removeEntry(entry.id)}
                      >
                        ×
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="playing-hours">
            <span className="playing-hours-label">{t('Horas jugadas', 'Hours played')}</span>
            <strong className="playing-hours-value">{formatHours(hours)}</strong>
            {isMe && (
              <div className="playing-hours-actions">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => addHours(1)}>
                  +1 h
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => addHours(-1)}
                  disabled={hours <= 0}
                  title={t('Restar una hora (para corregir)', 'Subtract an hour (to fix mistakes)')}
                >
                  −1
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
