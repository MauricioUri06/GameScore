import type { Genre } from '../api/types'

/** Combo box de categorías (géneros y temáticas). Valor vacío = todas. */
export function GenreSelect({
  genres,
  value,
  onChange,
  disabled,
}: {
  genres: Genre[] | null
  value: string
  onChange: (slug: string) => void
  disabled?: boolean
}) {
  return (
    <div className="filter-bar">
      <label htmlFor="genre" className="filter-label">
        Categoría
      </label>
      <select
        id="genre"
        className="select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">Todas las categorías</option>
        {genres?.map((g) => (
          <option key={g.id} value={g.slug}>
            {g.name}
          </option>
        ))}
      </select>
    </div>
  )
}
