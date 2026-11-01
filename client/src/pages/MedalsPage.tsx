import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Medal } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { ErrorMessage, Spinner } from '../components/Status'
import { useAsync } from '../hooks/useAsync'
import { useLang } from '../i18n/LanguageContext'
import { medalCategory, medalText } from '../i18n/serverText'

const CATEGORY_ORDER = ['Reseñas', 'Calificaciones', 'Comunidad', 'Géneros', 'Antigüedad', 'Especiales']

/** Medallas de un usuario: obtenidas y por obtener, con su progreso. */
export function MedalsPage() {
  const userName = useParams().userName ?? ''
  const { user } = useAuth()
  const { t, lang } = useLang()
  const medals = useAsync(() => api.medals(userName), [userName])
  const isMe = user?.userName.toLowerCase() === userName.toLowerCase()

  if (medals.loading) return <Spinner />
  if (medals.error || !medals.data) {
    return (
      <div className="container page">
        <ErrorMessage error={medals.error ?? new Error(t('No se encontraron medallas.', 'No medals found.'))} />
      </div>
    )
  }

  const earned = medals.data.filter((m) => m.earned).length
  const byCategory = CATEGORY_ORDER.map((c) => [c, medals.data!.filter((m) => m.category === c)] as const).filter(
    ([, items]) => items.length > 0,
  )

  return (
    <div className="container page">
      <h1>{isMe ? t('Mis medallas', 'My medals') : t(`Medallas de ${userName}`, `${userName}'s medals`)}</h1>
      <p className="muted page-intro">
        {t(`${earned} de ${medals.data.length} obtenidas`, `${earned} of ${medals.data.length} earned`)} ·{' '}
        <Link to={`/u/${userName}`}>
          {isMe ? t('Volver a mi perfil', 'Back to my profile') : t('Ver perfil', 'View profile')}
        </Link>
      </p>
      <div className="medals-total-bar" aria-hidden="true">
        <span style={{ width: `${(earned / medals.data.length) * 100}%` }} />
      </div>

      {byCategory.map(([category, items]) => (
        <section key={category} className="section">
          <div className="section-header">
            <h2>{medalCategory(category, lang)}</h2>
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
  const { t, lang } = useLang()
  const text = medalText(medal, lang)
  const pct = Math.round((medal.progress / medal.target) * 100)
  return (
    <div className={`medal-card${medal.earned ? ' earned' : ''}`}>
      <span className="medal-icon" aria-hidden="true">
        {medal.icon}
      </span>
      <strong className="medal-name">{text.name}</strong>
      <span className="small muted">{text.description}</span>
      {medal.earned ? (
        <span className="medal-status">{t('Obtenida', 'Earned')}</span>
      ) : (
        <>
          <div className="medal-progress" aria-label={t(`Progreso ${pct}%`, `Progress ${pct}%`)}>
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
