import type { Platform } from '../api/types'

const FAMILY_ORDER = ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Otras']

/** Agrupa plataformas por familia (PC, PlayStation, Xbox, Nintendo, Otras) respetando el orden de la lista. */
// eslint-disable-next-line react-refresh/only-export-components
export function groupPlatforms(platforms: Platform[]): [string, Platform[]][] {
  const groups = new Map<string, Platform[]>()
  for (const p of platforms) {
    if (!groups.has(p.family)) groups.set(p.family, [])
    groups.get(p.family)!.push(p)
  }
  return [...groups.entries()].sort(
    ([a], [b]) => (FAMILY_ORDER.indexOf(a) + 99) % 99 - ((FAMILY_ORDER.indexOf(b) + 99) % 99),
  )
}

/** Plataformas de solo lectura, agrupadas. */
export function PlatformList({ platforms }: { platforms: Platform[] }) {
  return (
    <div className="platform-groups">
      {groupPlatforms(platforms).map(([family, items]) => (
        <div key={family} className="platform-group">
          <span className="platform-family">{family}</span>
          <div className="tag-list">
            {items.map((p) => (
              <span key={p.id} className="tag selected">
                {p.name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
