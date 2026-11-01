import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { AdminUser, CountByName } from '../api/types'
import { Avatar } from '../components/Avatar'
import { ErrorMessage, Spinner } from '../components/Status'
import { useAsync } from '../hooks/useAsync'
import { useLang } from '../i18n/LanguageContext'

type SortKey = 'userName' | 'createdAt' | 'ratings' | 'reviewsWithText' | 'averageScore' | 'lastActivity'

const COLUMNS: { key: SortKey; label: [string, string] }[] = [
  { key: 'userName', label: ['Usuario', 'User'] },
  { key: 'createdAt', label: ['Registro', 'Joined'] },
  { key: 'ratings', label: ['Calificaciones', 'Ratings'] },
  { key: 'reviewsWithText', label: ['Reseñas con texto', 'Written reviews'] },
  { key: 'averageScore', label: ['Promedio', 'Average'] },
  { key: 'lastActivity', label: ['Última actividad', 'Last activity'] },
]

export function AdminPage() {
  const { t, locale } = useLang()
  const dateFmt = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' })
  const formatDate = (iso: string | null) => (iso ? dateFmt.format(new Date(iso)) : '—')
  const stats = useAsync(() => api.adminStats(), [])
  const users = useAsync(() => api.adminUsers(), [])
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'createdAt', desc: true })

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = (users.data ?? []).filter((u) => u.userName.toLowerCase().includes(q))
    const value = (u: AdminUser): string | number => {
      const v = u[sort.key]
      if (v === null) return -Infinity
      return typeof v === 'string' && sort.key !== 'userName' ? new Date(v).getTime() : v
    }
    return [...filtered].sort((a, b) => {
      const va = value(a)
      const vb = value(b)
      const cmp = typeof va === 'string' ? va.localeCompare(String(vb)) : (va as number) - (vb as number)
      return sort.desc ? -cmp : cmp
    })
  }, [users.data, query, sort])

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: key !== 'userName' }))

  return (
    <div className="container page">
      <h1>{t('Administración', 'Administration')}</h1>
      <p className="muted page-intro">
        {t('Usuarios registrados y actividad de GameScore.', 'Registered users and GameScore activity.')}
      </p>

      {stats.error ? (
        <ErrorMessage error={stats.error} />
      ) : stats.loading || !stats.data ? (
        <Spinner />
      ) : (
        <>
          <div className="stat-cards">
            <StatCard
              label={t('Usuarios', 'Users')}
              value={stats.data.users}
              hint={t(`+${stats.data.newUsersLast7Days} esta semana`, `+${stats.data.newUsersLast7Days} this week`)}
            />
            <StatCard
              label={t('Calificaciones', 'Ratings')}
              value={stats.data.ratings}
              hint={t(`+${stats.data.ratingsLast7Days} esta semana`, `+${stats.data.ratingsLast7Days} this week`)}
            />
            <StatCard label={t('Reseñas con texto', 'Written reviews')} value={stats.data.reviewsWithText} />
            <StatCard
              label={t('Promedio general', 'Overall average')}
              value={stats.data.averageScore?.toFixed(2) ?? '—'}
              hint={t('de 5 estrellas', 'out of 5 stars')}
            />
            <StatCard
              label={t('Juegos guardados', 'Stored games')}
              value={stats.data.gamesInDatabase}
              hint={t('copiados de IGDB', 'copied from IGDB')}
            />
          </div>

          <div className="admin-breakdowns">
            <Breakdown
              title={t('Calificaciones por plataforma', 'Ratings by platform')}
              items={stats.data.ratingsByPlatform}
            />
            <Breakdown title={t('Usuarios por plataforma', 'Users by platform')} items={stats.data.usersByPlatform} />
          </div>
        </>
      )}

      <section className="section">
        <div className="section-header">
          <h2>
            {t('Usuarios', 'Users')} ({users.data?.length ?? 0})
          </h2>
        </div>

        <div className="admin-toolbar">
          <input
            className="input"
            type="search"
            placeholder={t('Buscar por nickname…', 'Search by nickname…')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {users.error ? (
          <ErrorMessage error={users.error} />
        ) : users.loading ? (
          <Spinner />
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  {COLUMNS.map((c) => (
                    <th key={c.key} aria-sort={sort.key === c.key ? (sort.desc ? 'descending' : 'ascending') : 'none'}>
                      <button type="button" className="th-sort" onClick={() => toggleSort(c.key)}>
                        {t(...c.label)}
                        <span className="sort-arrow">{sort.key === c.key ? (sort.desc ? '↓' : '↑') : ''}</span>
                      </button>
                    </th>
                  ))}
                  <th>{t('Plataformas', 'Platforms')}</th>
                  <th>{t('Perfil', 'Profile')}</th>
                  <th>{t('Estado', 'Status')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.userName}>
                    <td>
                      <Link to={`/u/${u.userName}`} className="admin-user">
                        <Avatar name={u.userName} url={u.avatarUrl} />
                        <span>{u.userName}</span>
                      </Link>
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td className="num">{u.ratings}</td>
                    <td className="num">{u.reviewsWithText}</td>
                    <td className="num">{u.averageScore?.toFixed(2) ?? '—'}</td>
                    <td>{formatDate(u.lastActivity)}</td>
                    <td>{u.platforms.length ? u.platforms.join(', ') : <span className="faint">—</span>}</td>
                    <td className="small">
                      {u.avatarUrl ? t('Con foto', 'Has photo') : t('Sin foto', 'No photo')} · Top {u.topGames}/5 ·{' '}
                      {u.favoriteGenres} {t('géneros', 'genres')}
                    </td>
                    <td>
                      {u.isLockedOut ? (
                        <span className="status-badge locked">{t('Bloqueado', 'Locked')}</span>
                      ) : (
                        <span className="status-badge ok">{t('Activo', 'Active')}</span>
                      )}
                      {u.failedLoginAttempts > 0 && (
                        <div className="small faint">{u.failedLoginAttempts} intentos fallidos</div>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length + 3} className="faint" style={{ textAlign: 'center' }}>
                      {t('No hay usuarios que coincidan.', 'No matching users.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="stat-card">
      <span className="stat-card-label">{label}</span>
      <strong className="stat-card-value">{typeof value === 'number' ? value.toLocaleString() : value}</strong>
      {hint && <span className="small faint">{hint}</span>}
    </div>
  )
}

function Breakdown({ title, items }: { title: string; items: CountByName[] }) {
  const { t } = useLang()
  const max = Math.max(1, ...items.map((i) => i.count))
  return (
    <div className="card breakdown">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="faint small" style={{ textAlign: 'center', margin: 0 }}>
          {t('Sin datos todavía.', 'No data yet.')}
        </p>
      ) : (
        <ul>
          {items.map((i) => (
            <li key={i.name}>
              <span className="breakdown-name">{i.name}</span>
              <span className="breakdown-bar">
                <span style={{ width: `${(i.count / max) * 100}%` }} />
              </span>
              <span className="breakdown-count">{i.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
