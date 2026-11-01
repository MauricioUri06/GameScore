import { Link } from 'react-router-dom'
import type { Leader } from '../api/types'
import { Avatar } from './Avatar'

/** Top 10 de récords de un minijuego. */
export function Leaderboard({ leaders }: { leaders: Leader[] | null }) {
  return (
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
  )
}
