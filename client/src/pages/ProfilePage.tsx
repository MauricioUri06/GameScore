import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Avatar } from '../components/Avatar'
import { MedalCircle } from '../components/MedalCircle'
import { GameCover, igdbSize } from '../components/GameCard'
import { PlatformList } from '../components/PlatformList'
import { PlayingCard } from '../components/PlayingCard'
import { Stars } from '../components/Stars'
import { Empty, ErrorMessage, Spinner } from '../components/Status'
import { useAsync } from '../hooks/useAsync'

export function ProfilePage() {
  const userName = useParams().userName ?? ''
  const { user } = useAuth()
  const { data: profile, error, loading } = useAsync(() => api.profile(userName), [userName])
  // Juegos que se acaban de marcar como terminados (se quitan de "Jugando ahora" sin recargar)
  const [finishedNow, setFinishedNow] = useState<number[]>([])

  if (loading) return <Spinner />
  if (error || !profile) {
    return (
      <div className="container page">
        <ErrorMessage error={error ?? new Error('Perfil no encontrado.')} />
      </div>
    )
  }

  const isMe = user?.userName.toLowerCase() === profile.userName.toLowerCase()
  const playing = profile.playing.filter((g) => !finishedNow.includes(g.gameId))
  const finishedCount = profile.finishedCount + finishedNow.length
  const slots = Array.from({ length: 5 }, (_, i) => profile.topGames.find((t) => t.position === i + 1))

  return (
    <div className="container page">
      <header className="profile-header">
        <Avatar name={profile.userName} url={profile.avatarUrl} large />
        <div>
          <h1 style={{ marginBottom: 4 }}>{profile.userName}</h1>
          {isMe && (
            <div className="row" style={{ justifyContent: 'center', marginTop: 8 }}>
              <Link to="/settings/profile" className="btn btn-ghost btn-sm">
                Editar perfil
              </Link>
              {user?.isAdmin && (
                <Link to="/admin" className="btn btn-primary btn-sm">
                  Panel de administrador
                </Link>
              )}
            </div>
          )}
        </div>
        <div className="profile-stats">
          <div className="stat">
            <strong>{profile.ratingsCount}</strong>
            <span>Juegos</span>
          </div>
          <div className="stat">
            <strong>{profile.reviewsCount}</strong>
            <span>Reseñas</span>
          </div>
          <Link to={`/u/${profile.userName}/terminados`} className="stat stat-link">
            <strong>{finishedCount}</strong>
            <span>Terminados</span>
          </Link>
          <Link to="/older-newer" className="stat stat-link" title="Récord en Older/Newer">
            <strong>{profile.olderNewerBest}</strong>
            <span>Older/Newer</span>
          </Link>
          <div className="stat">
            <strong>{profile.averageGiven?.toFixed(1) ?? '–'}</strong>
            <span>Promedio</span>
          </div>
          <div className="stat">
            <strong>
              {profile.medalsEarned}/{profile.medalsTotal}
            </strong>
            <span>Medallas</span>
          </div>
        </div>
      </header>

      <div className="profile-medals">
        {profile.medals.length > 0 ? (
          <div className="medal-row">
            {profile.medals.map((m) => (
              <MedalCircle key={m.id} medal={m} />
            ))}
          </div>
        ) : isMe && profile.medalsEarned > 0 ? (
          <span className="small faint">
            Elige qué medallas mostrar en <Link to="/settings/profile">Editar perfil</Link>.
          </span>
        ) : null}
        <Link to={`/u/${profile.userName}/medallas`} className="small">
          Ver todas las medallas →
        </Link>
      </div>

      <div className="profile-boxes">
        <section className="profile-box">
          <h2>Géneros favoritos</h2>
          {profile.favoriteGenres.length ? (
            <div className="tag-list tag-list-center">
              {profile.favoriteGenres.map((g) => (
                <Link key={g.id} to={`/ranking?genre=${g.slug}`} className="tag tag-lg selected">
                  {g.name}
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted">
              {isMe ? (
                <>
                  Aún no elegiste tus géneros. <Link to="/settings/profile">Elígelos</Link>.
                </>
              ) : (
                'Sin géneros elegidos todavía.'
              )}
            </p>
          )}
        </section>

        <section className="profile-box">
          <h2>Plataformas</h2>
          {profile.platforms.length ? (
            <PlatformList platforms={profile.platforms} />
          ) : (
            <p className="muted">
              {isMe ? (
                <>
                  Aún no agregaste tus consolas. <Link to="/settings/profile">Agrégalas</Link>.
                </>
              ) : (
                'Sin plataformas todavía.'
              )}
            </p>
          )}
        </section>
      </div>

      {(playing.length > 0 || isMe) && (
        <section className="section">
          <div className="section-header">
            <h2>Jugando ahora</h2>
          </div>
          {finishedNow.length > 0 && (
            <p className="small muted" style={{ textAlign: 'center' }}>
              🏁 ¡Bien jugado! Lo encontrarás en{' '}
              <Link to={`/u/${profile.userName}/terminados`}>Juegos terminados</Link>.
            </p>
          )}
          {playing.length ? (
            <div className="playing-list">
              {playing.map((g) => (
                <PlayingCard
                  key={g.gameId}
                  game={g}
                  userName={profile.userName}
                  isMe={isMe}
                  onFinished={(id) => setFinishedNow((ids) => [...ids, id])}
                />
              ))}
            </div>
          ) : (
            <p className="muted" style={{ textAlign: 'center' }}>
              ¿Qué estás jugando? <Link to="/settings/profile">Agrégalo</Link>.
            </p>
          )}
        </section>
      )}

      <section className="section">
        <div className="section-header">
          <h2>Top 5</h2>
        </div>
        <div className="top5">
          {slots.map((game, i) =>
            game ? (
              <Link key={i} to={`/games/${game.gameId}`} className="game-card">
                <div className="game-cover">
                  <GameCover src={game.coverUrl} name={game.name} />
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
          <h2>Últimas calificaciones</h2>
        </div>
        {profile.recentRatings.length === 0 ? (
          <Empty>Todavía no calificó ningún juego.</Empty>
        ) : (
          <div className="activity-list">
            {profile.recentRatings.map((r) => (
              <Link key={r.gameId} to={`/games/${r.gameId}`} className="activity-item">
                {r.gameCover ? (
                  <img className="activity-thumb" src={igdbSize(r.gameCover, 'cover_small')} alt="" />
                ) : (
                  <span className="activity-thumb" />
                )}
                <span style={{ minWidth: 0 }}>
                  <strong>{r.gameName}</strong>
                  <br />
                  <Stars value={r.score} size="0.95rem" />
                  {r.platformName && <span className="small muted"> · {r.platformName}</span>}
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
