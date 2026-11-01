import type { Medal } from '../api/types'

/**
 * Medalla en un círculo (solo el emoji). Al pasar el cursor —o al enfocarla con el teclado—
 * aparece debajo un recuadro verde con su nombre y descripción.
 */
export function MedalCircle({ medal, size = 'md' }: { medal: Medal; size?: 'md' | 'lg' }) {
  return (
    <span className={`medal-circle ${size}`} tabIndex={0} aria-label={`${medal.name}: ${medal.description}`}>
      <span aria-hidden="true">{medal.icon}</span>
      <span className="medal-tooltip" role="tooltip">
        <strong>{medal.name}</strong>
        <span>{medal.description}</span>
      </span>
    </span>
  )
}
