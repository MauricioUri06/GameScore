import { useState } from 'react'

const STAR_PATH =
  'M12 2.5l2.95 6.27 6.88.78-5.1 4.68 1.4 6.77L12 17.6 5.87 21l1.4-6.77-5.1-4.68 6.88-.78z'

function StarShape({ fill }: { fill: 0 | 0.5 | 1 }) {
  return (
    <span className="star" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="star-empty">
        <path d={STAR_PATH} fill="currentColor" />
      </svg>
      {fill > 0 && (
        <svg viewBox="0 0 24 24" style={fill === 0.5 ? { clipPath: 'inset(0 50% 0 0)' } : undefined}>
          <path d={STAR_PATH} fill="currentColor" />
        </svg>
      )}
    </span>
  )
}

function fillFor(value: number, index: number): 0 | 0.5 | 1 {
  const diff = value - index
  if (diff >= 1) return 1
  if (diff >= 0.5) return 0.5
  return 0
}

/** Estrellas de solo lectura (0 a 5, admite medias). */
export function Stars({ value, size = '1rem' }: { value: number; size?: string }) {
  const rounded = Math.round(value * 2) / 2
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${value.toFixed(1)} de 5 estrellas`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <StarShape key={i} fill={fillFor(rounded, i)} />
      ))}
    </span>
  )
}

/** Selector de estrellas con medias estrellas (0.5 a 5). */
export function StarInput({
  value,
  onChange,
  disabled,
}: {
  value: number | null
  onChange: (value: number) => void
  disabled?: boolean
}) {
  const [hover, setHover] = useState<number | null>(null)
  const shown = hover ?? value ?? 0

  return (
    <div className="star-input" onMouseLeave={() => setHover(null)}>
      <span className="stars" role="radiogroup" aria-label="Tu puntaje">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="star" style={{ position: 'relative' }}>
            <StarShape fill={fillFor(shown, i)} />
            {[0.5, 1].map((part) => {
              const starValue = i + part
              return (
                <button
                  key={part}
                  type="button"
                  className={`star-input-half ${part === 0.5 ? 'left' : 'right'}`}
                  role="radio"
                  aria-checked={value === starValue}
                  aria-label={`${starValue} estrellas`}
                  disabled={disabled}
                  onMouseEnter={() => setHover(starValue)}
                  onFocus={() => setHover(starValue)}
                  onBlur={() => setHover(null)}
                  onClick={() => onChange(starValue)}
                />
              )
            })}
          </span>
        ))}
      </span>
      <span className="star-input-value">{shown > 0 ? shown.toFixed(1) : '–'}</span>
    </div>
  )
}
