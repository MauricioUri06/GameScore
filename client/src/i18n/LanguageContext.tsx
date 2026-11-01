import { createContext, useContext, useState, type ReactNode } from 'react'
import { getLang, localeFor, storeLang, type Lang } from './lang'

interface LanguageValue {
  lang: Lang
  setLang: (lang: Lang) => void
  /** Devuelve el texto en el idioma actual: t('Juegos', 'Games'). */
  t: (es: string, en: string) => string
  /** Locale para Intl (fechas y números). */
  locale: string
}

const LanguageContext = createContext<LanguageValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getLang)
  const setLang = (next: Lang) => {
    storeLang(next)
    setLangState(next)
  }
  const value: LanguageValue = {
    lang,
    setLang,
    t: (es, en) => (lang === 'en' ? en : es),
    locale: localeFor(lang),
  }
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang debe usarse dentro de <LanguageProvider>')
  return ctx
}
