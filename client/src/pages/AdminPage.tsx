import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { AdminUser, CountByName } from '../api/types'
import { Avatar } from '../components/Avatar'
import { ErrorMessage, Spinner } from '../components/Status'
import { useAsync } from '../hooks/useAsync'

type SortKey = 'userName' | 'createdAt' | 'ratings' | 'reviewsWithText' | 'averageScore' | 'lastActivity'

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'userName', label: 'Usuario' },
  { key: 'createdAt', label: 'Registro' },
  { key: 'ratings', label: 'Calificaciones' },
  { key: 'reviewsWithText', label: 'Reseñas con texto' },
  { key: 'averageScore', label: 'Promedio' },
  { key: 'lastActivity', label: 'Última actividad' },
]

const dateFmt = new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', year: 'numeric' })
const formatDate = (iso: string | null) => (iso ? dateFmt.format(new Date(iso)) : '—')

export function AdminPage() {
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
      <h1>Administración</h1>
      <p className="muted page-intro">Usuarios registrados y actividad de GameScore.</p>

      {stats.error ? (
        <ErrorMessage error={stats.error} />
      ) : stats.loading || !stats.data ? (
        <Spinner />
      ) : (
        <>
          <div className="stat-cards">
            <StatCard label="Usuarios" value={stats.data.users} hint={`+${stats.data.newUsersLast7Days} esta semana`} />
            <StatCard
              label="Calificaciones"
              value={stats.data.ratings}
              hint={`+${stats.data.ratingsLast7Days} esta semana`}
            />
            <StatCard label="Reseñas con texto" value={stats.data.reviewsWithText} />
            <StatCard label="Promedio general" value={stats.data.averageScore?.toFixed(2) ?? '—'} hint="de 5 estrellas" />
            <StatCard label="Juegos guardados" value={stats.data.gamesInDatabase} hint="copiados de IGDB" />
          </div>

          <div className="admin-breakdowns">
            <Breakdown title="Calificaciones por plataforma" items={stats.data.ratingsByPlatform} />
            <Breakdown title="Usuarios por plataforma" items={stats.data.usersByPlatform} />
          </div>
        </>
      )}

      <section className="section">
        <div className="section-header">
          <h2>Usuarios ({users.data?.length ?? 0})</h2>
        </div>

        <div className="admin-toolbar">
          <input
            className="input"
            type="search"
            placeholder="Buscar por nickname…"
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
                        {c.label}
                        <span className="sort-arrow">{sort.key === c.key ? (sort.desc ? '↓' : '↑') : ''}</span>
                      </button>
                    </th>
                  ))}
                  <th>Plataformas</th>
                  <th>Perfil</th>
                  <th>Estado</th>
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
                      {u.avatarUrl ? 'Con foto' : 'Sin foto'} · Top {u.topGames}/5 · {u.favoriteGenres} géneros
                    </td>
                    <td>
                      {u.isLockedOut ? (
                        <span className="status-badge locked">Bloqueado</span>
                      ) : (
                        <span className="status-badge ok">Activo</span>
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
                      No hay usuarios que coincidan.
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
      <strong className="stat-card-value">{typeof value === 'number' ? value.toLocaleString('es') : value}</strong>
      {hint && <span className="small faint">{hint}</span>}
    </div>
  )
}

function Breakdown({ title, items }: { title: string; items: CountByName[] }) {
  const max = Math.max(1, ...items.map((i) => i.count))
  return (
    <div className="card breakdown">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="faint small" style={{ textAlign: 'center', margin: 0 }}>
          Sin datos todavía.
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
