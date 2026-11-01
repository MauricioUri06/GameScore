export type Lang = 'es' | 'en'

const KEY = 'gamescore.lang'

function detect(): Lang {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'es' || saved === 'en') return saved
  } catch {
    /* almacenamiento no disponible */
  }
  // Primera visita: según el idioma del navegador (inglés → inglés; cualquier otro → español)
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'es'
}

let current: Lang = detect()
if (typeof document !== 'undefined') document.documentElement.lang = current

/** Idioma actual (para código que no es un componente, como el cliente de la API). */
export const getLang = (): Lang => current

export function storeLang(lang: Lang) {
  current = lang
  try {
    localStorage.setItem(KEY, lang)
  } catch {
    /* almacenamiento no disponible */
  }
  document.documentElement.lang = lang
}

/** Texto en el idioma actual, fuera de componentes. Dentro de componentes usa `useLang().t`. */
export const tr = (es: string, en: string) => (current === 'en' ? en : es)

export const localeFor = (lang: Lang) => (lang === 'en' ? 'en-US' : 'es')
