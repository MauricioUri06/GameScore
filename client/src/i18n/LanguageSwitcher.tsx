import { useLang } from './LanguageContext'

/** Botones ES | EN (esquina superior izquierda). */
export function LanguageSwitcher() {
  const { lang, setLang, t } = useLang()
  return (
    <div className="lang-switch" role="group" aria-label={t('Idioma', 'Language')}>
      {(['es', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          className={lang === l ? 'active' : ''}
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          title={l === 'es' ? 'Español' : 'English'}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
