import { Link } from 'react-router-dom'
import type { Leader } from '../api/types'
import { Avatar } from './Avatar'
import { useLang } from '../i18n/LanguageContext'

/** Top 10 de récords de un minijuego. */
export function Leaderboard({
  leaders,
  format = String,
  title,
}: {
  leaders: Leader[] | null
  format?: (value: number) => string
  title?: string
}) {
  const { t } = useLang()
  return (
    <section className="section">
      <div className="section-header">
        <h2>{title ?? t('Mejores récords', 'Top records')}</h2>
      </div>
      {leaders === null ? null : leaders.length === 0 ? (
        <p className="muted" style={{ textAlign: 'center' }}>
          {t('Nadie tiene récord todavía. ¡Sé el primero!', 'No records yet. Be the first!')}
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
              <strong>{format(l.best)}</strong>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
