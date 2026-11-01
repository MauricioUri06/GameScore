import type { Genre } from '../api/types'
import { useLang } from '../i18n/LanguageContext'
import { genreName } from '../i18n/serverText'

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
  const { t, lang } = useLang()
  return (
    <div className="filter-bar">
      <label htmlFor="genre" className="filter-label">
        {t('Categoría', 'Category')}
      </label>
      <select
        id="genre"
        className="select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{t('Todas las categorías', 'All categories')}</option>
        {genres?.map((g) => (
          <option key={g.id} value={g.slug}>
            {genreName(g.name, lang)}
          </option>
        ))}
      </select>
    </div>
  )
}
