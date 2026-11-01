import type { Medal } from '../api/types'
import { useLang } from '../i18n/LanguageContext'
import { medalText } from '../i18n/serverText'

/**
 * Medalla en un círculo (solo el emoji). Al pasar el cursor —o al enfocarla con el teclado—
 * aparece debajo un recuadro verde con su nombre y descripción.
 */
export function MedalCircle({ medal, size = 'md' }: { medal: Medal; size?: 'md' | 'lg' }) {
  const { lang } = useLang()
  const { name, description } = medalText(medal, lang)
  return (
    <span className={`medal-circle ${size}`} tabIndex={0} aria-label={`${name}: ${description}`}>
      <span aria-hidden="true">{medal.icon}</span>
      <span className="medal-tooltip" role="tooltip">
        <strong>{name}</strong>
        <span>{description}</span>
      </span>
    </span>
  )
}
