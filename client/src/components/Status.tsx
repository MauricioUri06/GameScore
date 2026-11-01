import type { ReactNode } from 'react'
import { ApiError } from '../api/client'
import { useLang } from '../i18n/LanguageContext'
import { serverError } from '../i18n/serverText'

export function Spinner() {
  const { t } = useLang()
  return <div className="spinner" role="status" aria-label={t('Cargando', 'Loading')} />
}

export function ErrorMessage({ error }: { error: unknown }) {
  const { lang } = useLang()
  const message = error instanceof ApiError || error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
  return <div className="alert">{serverError(message, lang)}</div>
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}
