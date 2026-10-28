import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Avatar } from '../components/Avatar'
import { GameCover, resizeRawgImage } from '../components/GameCard'
import { Stars } from '../components/Stars'
import { Empty, ErrorMessage, Spinner } from '../components/Status'
import { useAsync } from '../hooks/useAsync'

export function ProfilePage() {
  const userName = useParams().userName ?? ''
  const { user } = useAuth()
  const { data: profile, error, loading } = useAsync(() => api.profile(userName), [userName])

  if (loading) return <Spinner />
  if (error || !profile) {
    return (
      <div className="container page">
        <ErrorMessage error={error ?? new Error('Perfil no encontrado.')} />
      </div>
    )
  }

  const isMe = user?.userName.toLowerCase() === profile.userName.toLowerCase()
  const slots = Array.from({ length: 5 }, (_, i) => profile.topGames.find((t) => t.position === i + 1))

  return (
    <div className="container page">
      <header className="profile-header">
        <Avatar url={profile.avatarUrl} name={profile.displayName} large />
        <div>
          <h1 style={{ marginBottom: 4 }}>{profile.displayName}</h1>
          <div className="muted">@{profile.userName}</div>
          {profile.bio && <p style={{ maxWidth: 520, marginBottom: 0 }}>{profile.bio}</p>}
          {isMe && (
            <Link to="/settings/profile" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>
              Editar perfil
            </Link>
          )}
        </div>
        <div className="profile-stats">
          <div className="stat">
            <strong>{profile.ratingsCount}</strong>
            <span>Juegos</span>
          </div>
          <div className="stat">
            <strong>{profile.averageGiven?.toFixed(1) ?? '–'}</strong>
            <span>Promedio</span>
          </div>
        </div>
      </header>

      <section className="section">
        <div className="section-header">
          <h2>Top 5</h2>
        </div>
        <div className="top5">
          {slots.map((game, i) =>
            game ? (
              <Link key={i} to={`/games/${game.rawgId}`} className="game-card">
                <div className="game-cover">
                  <GameCover src={game.backgroundImage} name={game.name} />
                  <span className="score-pill overlay">#{game.position}</span>
                </div>
                <div className="game-card-body">
                  <span className="game-card-title">{game.name}</span>
                </div>
              </Link>
            ) : (
              <div key={i} className="top5-slot">
                {isMe ? <Link to="/settings/profile">+ Añadir</Link> : `#${i + 1}`}
              </div>
            ),
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Géneros favoritos</h2>
        </div>
        {profile.favoriteGenres.length ? (
          <div className="tag-list">
            {profile.favoriteGenres.map((g) => (
              <Link key={g.id} to={`/ranking?genre=${g.slug}`} className="tag selected">
                {g.name}
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted">Sin géneros elegidos todavía.</p>
        )}
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Últimas calificaciones</h2>
        </div>
        {profile.recentRatings.length === 0 ? (
          <Empty>Todavía no calificó ningún juego.</Empty>
        ) : (
          <div className="activity-list">
            {profile.recentRatings.map((r) => (
              <Link key={r.rawgId} to={`/games/${r.rawgId}`} className="activity-item">
                {r.gameImage ? (
                  <img className="activity-thumb" src={resizeRawgImage(r.gameImage, 420)} alt="" />
                ) : (
                  <span className="activity-thumb" />
                )}
                <span style={{ minWidth: 0 }}>
                  <strong>{r.gameName}</strong>
                  <br />
                  <Stars value={r.score} size="0.95rem" />
                  {r.review && (
                    <p className="small muted" style={{ margin: '4px 0 0' }}>
                      {r.review.length > 110 ? `${r.review.slice(0, 110)}…` : r.review}
                    </p>
                  )}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
