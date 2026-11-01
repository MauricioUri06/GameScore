import { Link } from 'react-router-dom'
import type { Leader, LeaderboardData } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { useLang } from '../i18n/LanguageContext'
import { Avatar } from './Avatar'

/** Top 10 de récords de un minijuego, más tu puesto si no estás entre los 10. */
export function Leaderboard({
  board,
  format = String,
  title,
}: {
  board: LeaderboardData | null
  format?: (value: number) => string
  title?: string
}) {
  const { t } = useLang()
  const { user } = useAuth()
  if (board === null) return null

  const me = board.me
  const meInTop = me !== null && board.top.some((l) => l.userName === me.userName)

  const row = (l: Leader, mine: boolean) => (
    <li key={l.userName} className={mine ? 'mine' : undefined}>
      <span className="on-rank">#{l.position}</span>
      <Link to={`/u/${l.userName}`} className="on-leader-user">
        <Avatar name={l.userName} url={l.avatarUrl} />
        {l.userName}
        {mine && <span className="on-you">{t('(tú)', '(you)')}</span>}
      </Link>
      <strong>{format(l.best)}</strong>
    </li>
  )

  return (
    <section className="section">
      <div className="section-header">
        <h2>{title ?? t('Mejores récords', 'Top records')}</h2>
      </div>
      {board.top.length === 0 ? (
        <p className="muted" style={{ textAlign: 'center' }}>
          {t('Nadie tiene récord todavía. ¡Sé el primero!', 'No records yet. Be the first!')}
        </p>
      ) : (
        <ol className="on-leaders">
          {board.top.map((l) => row(l, l.userName === me?.userName))}
          {me && !meInTop && (
            <>
              <li className="on-gap" aria-hidden="true">
                ⋯
              </li>
              {row(me, true)}
            </>
          )}
        </ol>
      )}
      {user && !me && board.top.length > 0 && (
        <p className="small muted" style={{ textAlign: 'center' }}>
          {t('Todavía no tienes récord en este juego.', "You don't have a record in this game yet.")}
        </p>
      )}
    </section>
  )
}
