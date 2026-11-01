import type { Platform } from '../api/types'
import { useLang } from '../i18n/LanguageContext'
import { platformFamily } from '../i18n/serverText'

const FAMILY_ORDER = ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Otras']

/** Agrupa consolas por familia (PC, PlayStation, Xbox, Nintendo, Otras) respetando el orden de la lista. */
// eslint-disable-next-line react-refresh/only-export-components
export function groupPlatforms(platforms: Platform[]): [string, Platform[]][] {
  const groups = new Map<string, Platform[]>()
  for (const p of platforms) {
    if (!groups.has(p.family)) groups.set(p.family, [])
    groups.get(p.family)!.push(p)
  }
  const rank = (family: string) => {
    const i = FAMILY_ORDER.indexOf(family)
    return i === -1 ? FAMILY_ORDER.length : i
  }
  return [...groups.entries()].sort(([a], [b]) => rank(a) - rank(b))
}

/** Consolas de solo lectura, agrupadas por familia. */
export function PlatformList({ platforms }: { platforms: Platform[] }) {
  const { lang } = useLang()
  return (
    <div className="platform-groups">
      {groupPlatforms(platforms).map(([family, items]) => (
        <div key={family} className="platform-group">
          <span className="platform-family">{platformFamily(family, lang)}</span>
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
