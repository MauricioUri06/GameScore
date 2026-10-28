import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Avatar } from '../components/Avatar'
import { GameCard, GameGridSkeleton, resizeRawgImage } from '../components/GameCard'
import { Stars } from '../components/Stars'
import { Empty, ErrorMessage } from '../components/Status'
import { useAsync } from '../hooks/useAsync'

export function HomePage() {
  const { user } = useAuth()
  const popular = useAsync(() => api.popularGames(), [])
  const ranking = useAsync(() => api.ranking(6), [])
  const activity = useAsync(() => api.activity(8), [])

  return (
    <div className="container page">
      <section className="hero">
        <h1>
          Tu diario de <em>videojuegos</em>.
        </h1>
        <p>
          Califica los juegos que jugaste, arma tu top 5, descubre qué piensa la comunidad y encuentra
          tu próxima obsesión.
        </p>
        <div className="hero-actions">
          {user ? (
            <Link to="/search" className="btn btn-primary">
              Calificar un juego
            </Link>
          ) : (
            <Link to="/register" className="btn btn-primary">
              Empieza gratis
            </Link>
          )}
          <Link to="/ranking" className="btn btn-ghost">
            Ver ranking
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Populares ahora</h2>
          <Link to="/search" className="small">
            Explorar más →
          </Link>
        </div>
        {popular.error ? (
          <ErrorMessage error={popular.error} />
        ) : popular.loading ? (
          <GameGridSkeleton count={12} />
        ) : (
          <div className="game-grid">
            {popular.data?.map((g) => <GameCard key={g.rawgId} game={g} />)}
          </div>
        )}
      </section>

      <div className="grid-2 section">
        <section>
          <div className="section-header">
            <h2>Mejor puntuados</h2>
            <Link to="/ranking" className="small">
              Ranking completo →
            </Link>
          </div>
          {ranking.error ? (
            <ErrorMessage error={ranking.error} />
          ) : ranking.loading ? null : ranking.data?.length ? (
            <div className="ranking-list">
              {ranking.data.map((g) => (
                <Link key={g.rawgId} to={`/games/${g.rawgId}`} className="ranking-row">
                  <span className={`ranking-pos${g.position <= 3 ? ' podium' : ''}`}>{g.position}</span>
                  {g.backgroundImage ? (
                    <img className="ranking-thumb" src={resizeRawgImage(g.backgroundImage, 420)} alt="" />
                  ) : (
                    <span className="ranking-thumb" />
                  )}
                  <span>
                    <strong>{g.name}</strong>
                    <br />
                    <span className="small muted">{g.ratingsCount} calificaciones</span>
                  </span>
                  <span className="ranking-score">
                    <strong>{g.averageScore.toFixed(1)}</strong>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <Empty>Todavía no hay calificaciones. ¡Sé el primero!</Empty>
          )}
        </section>

        <section>
          <div className="section-header">
            <h2>Actividad reciente</h2>
          </div>
          {activity.error ? (
            <ErrorMessage error={activity.error} />
          ) : activity.loading ? null : activity.data?.length ? (
            <div className="ranking-list">
              {activity.data.map((a) => (
                <Link
                  key={`${a.userName}-${a.rawgId}`}
                  to={`/games/${a.rawgId}`}
                  className="activity-item"
                >
                  {a.gameImage ? (
                    <img className="activity-thumb" src={resizeRawgImage(a.gameImage, 420)} alt="" />
                  ) : (
                    <span className="activity-thumb" />
                  )}
                  <span style={{ minWidth: 0 }}>
                    <span className="review-head">
                      <Avatar url={a.avatarUrl} name={a.displayName} />
                      <span>
                        <strong style={{ color: 'var(--text)' }}>{a.displayName}</strong> calificó
                      </span>
                    </span>
                    <strong style={{ display: 'block', marginTop: 4 }}>{a.gameName}</strong>
                    <Stars value={a.score} size="0.9rem" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <Empty>Aún no hay actividad.</Empty>
          )}
        </section>
      </div>
    </div>
  )
}
