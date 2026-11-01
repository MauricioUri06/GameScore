import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Medal } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { ErrorMessage, Spinner } from '../components/Status'
import { useAsync } from '../hooks/useAsync'

const CATEGORY_ORDER = ['Reseñas', 'Calificaciones', 'Comunidad', 'Géneros', 'Antigüedad', 'Especiales']

/** Medallas de un usuario: obtenidas y por obtener, con su progreso. */
export function MedalsPage() {
  const userName = useParams().userName ?? ''
  const { user } = useAuth()
  const medals = useAsync(() => api.medals(userName), [userName])
  const isMe = user?.userName.toLowerCase() === userName.toLowerCase()

  if (medals.loading) return <Spinner />
  if (medals.error || !medals.data) {
    return (
      <div className="container page">
        <ErrorMessage error={medals.error ?? new Error('No se encontraron medallas.')} />
      </div>
    )
  }

  const earned = medals.data.filter((m) => m.earned).length
  const byCategory = CATEGORY_ORDER.map((c) => [c, medals.data!.filter((m) => m.category === c)] as const).filter(
    ([, items]) => items.length > 0,
  )

  return (
    <div className="container page">
      <h1>{isMe ? 'Mis medallas' : `Medallas de ${userName}`}</h1>
      <p className="muted page-intro">
        {earned} de {medals.data.length} obtenidas ·{' '}
        <Link to={`/u/${userName}`}>{isMe ? 'Volver a mi perfil' : 'Ver perfil'}</Link>
      </p>
      <div className="medals-total-bar" aria-hidden="true">
        <span style={{ width: `${(earned / medals.data.length) * 100}%` }} />
      </div>

      {byCategory.map(([category, items]) => (
        <section key={category} className="section">
          <div className="section-header">
            <h2>{category}</h2>
          </div>
          <div className="medal-grid">
            {[...items]
              .sort((a, b) => Number(b.earned) - Number(a.earned))
              .map((m) => (
                <MedalCard key={m.id} medal={m} />
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function MedalCard({ medal }: { medal: Medal }) {
  const pct = Math.round((medal.progress / medal.target) * 100)
  return (
    <div className={`medal-card${medal.earned ? ' earned' : ''}`}>
      <span className="medal-icon" aria-hidden="true">
        {medal.icon}
      </span>
      <strong className="medal-name">{medal.name}</strong>
      <span className="small muted">{medal.description}</span>
      {medal.earned ? (
        <span className="medal-status">Obtenida</span>
      ) : (
        <>
          <div className="medal-progress" aria-label={`Progreso ${pct}%`}>
            <span style={{ width: `${pct}%` }} />
          </div>
          <span className="small faint">
            {medal.progress} / {medal.target}
          </span>
        </>
      )}
    </div>
  )
}
