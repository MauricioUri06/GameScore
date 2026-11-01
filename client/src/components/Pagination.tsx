import { useLang } from '../i18n/LanguageContext'
/** Números de página a mostrar: primera, última y las cercanas a la actual, con "…" entre medio. */
function pageNumbers(page: number, totalPages: number): (number | '…')[] {
  const pages = new Set([1, totalPages, page - 2, page - 1, page, page + 1, page + 2])
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)

  const result: (number | '…')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push('…')
    result.push(p)
  })
  return result
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  const { t } = useLang()
  if (totalPages <= 1) return null

  return (
    <nav className="pagination" aria-label={t('Páginas', 'Pages')}>
      <button type="button" className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        {t('← Anterior', '← Previous')}
      </button>
      <div className="pagination-pages">
        {pageNumbers(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="pagination-gap">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`pagination-page${p === page ? ' current' : ''}`}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          ),
        )}
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        {t('Siguiente →', 'Next →')}
      </button>
    </nav>
  )
}
