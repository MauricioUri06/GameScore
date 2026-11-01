import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { FinishedGame } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { GameCover } from '../components/GameCard'
import { Stars } from '../components/Stars'
import { ErrorMessage, Spinner } from '../components/Status'
import { useAsync } from '../hooks/useAsync'

const dateFmt = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' })
const formatHours = (h: number) => `${Number.isInteger(h) ? h : h.toFixed(1)} h`

/** Juegos que el usuario marcó como terminados desde "Jugando ahora". */
export function FinishedPage() {
  const userName = useParams().userName ?? ''
  const { user } = useAuth()
  const finished = useAsync(() => api.finished(userName), [userName])
  const [items, setItems] = useState<FinishedGame[]>([])
  const [error, setError] = useState<unknown>(null)
  const isMe = user?.userName.toLowerCase() === userName.toLowerCase()

  useEffect(() => setItems(finished.data ?? []), [finished.data])

  if (finished.loading) return <Spinner />
  if (finished.error) {
    return (
      <div className="container page">
        <ErrorMessage error={finished.error} />
      </div>
    )
  }

  const totalHours = items.reduce((sum, g) => sum + g.hoursPlayed, 0)

  const remove = async (gameId: number) => {
    setError(null)
    try {
      await api.deleteFinished(gameId)
      setItems((list) => list.filter((g) => g.gameId !== gameId))
    } catch (err) {
      setError(err)
    }
  }

  return (
    <div className="container page">
      <h1>{isMe ? 'Mis juegos terminados' : `Juegos terminados de ${userName}`}</h1>
      <p className="muted page-intro">
        {items.length} {items.length === 1 ? 'juego terminado' : 'juegos terminados'}
        {totalHours > 0 && <> · {formatHours(totalHours)} en total</>} ·{' '}
        <Link to={`/u/${userName}`}>{isMe ? 'Volver a mi perfil' : 'Ver perfil'}</Link>
      </p>
      {error ? <ErrorMessage error={error} /> : null}

      {items.length === 0 ? (
        <p className="muted" style={{ textAlign: 'center' }}>
          {isMe
            ? 'Cuando acabes un juego de "Jugando ahora", márcalo como terminado y aparecerá aquí.'
            : 'Todavía no terminó ningún juego.'}
        </p>
      ) : (
        <div className="finished-grid">
          {items.map((g) => (
            <article key={g.gameId} className="finished-card">
              <Link to={`/games/${g.gameId}`} className="finished-cover">
                <GameCover src={g.coverUrl} name={g.name} />
                <span className="finished-flag" aria-hidden="true">
                  🏁
                </span>
              </Link>
              <div className="finished-body">
                <Link to={`/games/${g.gameId}`} className="finished-title">
                  {g.name}
                </Link>
                <span className="faint small">Terminado el {dateFmt.format(new Date(g.finishedAt))}</span>
                <div className="finished-meta">
                  <span className="finished-hours">{formatHours(g.hoursPlayed)}</span>
                  {g.score != null ? (
                    <Stars value={g.score} size="0.85rem" />
                  ) : isMe ? (
                    <Link to={`/games/${g.gameId}`} className="small">
                      Calificar →
                    </Link>
                  ) : null}
                </div>
                {g.journalCount > 0 && (
                  <span className="faint small">
                    {g.journalCount} {g.journalCount === 1 ? 'entrada' : 'entradas'} en el diario
                  </span>
                )}
              </div>
              {isMe && (
                <button
                  type="button"
                  className="journal-delete"
                  title="Quitar de terminados"
                  aria-label={`Quitar ${g.name} de terminados`}
                  onClick={() => remove(g.gameId)}
                >
                  ×
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
