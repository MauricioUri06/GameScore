import type { ReactNode } from 'react'
import { ApiError } from '../api/client'

export function Spinner() {
  return <div className="spinner" role="status" aria-label="Cargando" />
}

export function ErrorMessage({ error }: { error: unknown }) {
  const message =
    error instanceof ApiError || error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
  return <div className="alert">{message}</div>
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}
