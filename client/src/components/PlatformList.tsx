import type { Platform } from '../api/types'

/** Plataformas de solo lectura (PC, PlayStation, Xbox…). */
export function PlatformList({ platforms }: { platforms: Platform[] }) {
  return (
    <div className="tag-list tag-list-center">
      {platforms.map((p) => (
        <span key={p.id} className="tag tag-lg selected">
          {p.name}
        </span>
      ))}
    </div>
  )
}
