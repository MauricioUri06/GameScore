import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { JournalEntry, PlayingGame } from '../api/types'
import { GameCover } from './GameCard'
import { ErrorMessage } from './Status'

const dateFmt = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' })
const formatHours = (h: number) => `${Number.isInteger(h) ? h : h.toFixed(1)} h`

/**
 * Juego de "Jugando ahora": portada, descripción, diario (lo último que hizo el jugador)
 * y horas jugadas. Si es tu perfil puedes escribir en el diario y sumar horas.
 */
export function PlayingCard({ game, userName, isMe }: { game: PlayingGame; userName: string; isMe: boolean }) {
  const [hours, setHours] = useState(game.hoursPlayed)
  const [lastEntry, setLastEntry] = useState<JournalEntry | null>(game.lastEntry)
  const [count, setCount] = useState(game.journalCount)
  const [history, setHistory] = useState<JournalEntry[] | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [expanded, setExpanded] = useState(false)

  const addHours = async (delta: number) => {
    setError(null)
    const previous = hours
    setHours(Math.max(0, Math.round((hours + delta) * 10) / 10)) // respuesta inmediata
    try {
      const res = await api.addPlayingHours(game.gameId, delta)
      setHours(res.hoursPlayed)
    } catch (err) {
      setHours(previous)
      setError(err)
    }
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
        <Link to={`/games/${game.gameId}`} className="playing-title">
          {game.name}
        </Link>
        {game.description ? (
          <>
            <p className={`playing-description${expanded ? ' expanded' : ''}`}>{game.description}</p>
            {game.description.length > 260 && (
              <button type="button" className="link-button small" onClick={() => setExpanded(!expanded)}>
                {expanded ? 'Ver menos' : 'Ver más'}
              </button>
            )}
          </>
        ) : (
          <p className="faint small">Sin descripción.</p>
        )}

        {error ? <ErrorMessage error={error} /> : null}

        <div className="playing-tracker">
          <div className="playing-journal">
            <h3>Diario</h3>
            {lastEntry ? (
              <div className="journal-entry latest">
                <span className="journal-date">{dateFmt.format(new Date(lastEntry.createdAt))}</span>
                <p>{lastEntry.text}</p>
              </div>
            ) : (
              <p className="faint small" style={{ margin: 0 }}>
                {isMe ? '¿Qué hiciste en tu última partida?' : 'Todavía no escribió nada.'}
              </p>
            )}

            {isMe && (
              <form className="journal-form" onSubmit={addEntry}>
                <textarea
                  className="textarea"
                  maxLength={500}
                  placeholder="Ej.: Derroté al jefe del capítulo 3 y desbloqueé el doble salto."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <div className="journal-form-actions">
                  <span className="faint small">{text.length}/500</span>
                  <button className="btn btn-primary btn-sm" disabled={busy || !text.trim()}>
                    {busy ? 'Guardando…' : 'Anotar'}
                  </button>
                </div>
              </form>
            )}

            {count > 1 && (
              <button type="button" className="link-button small" onClick={toggleHistory}>
                {showHistory ? 'Ocultar diario' : `Ver diario completo (${count})`}
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
                        aria-label="Borrar entrada"
                        title="Borrar entrada"
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
            <span className="playing-hours-label">Horas jugadas</span>
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
                  title="Restar una hora (para corregir)"
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
