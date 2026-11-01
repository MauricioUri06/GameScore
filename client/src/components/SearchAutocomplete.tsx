import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { GameSummary } from '../api/types'
import { igdbSize } from './GameCard'

/**
 * Buscador con autocompletado: al escribir muestra sugerencias de juegos.
 * Flechas ↑/↓ para moverse, Enter para abrir la sugerencia marcada (o buscar el texto), Esc para cerrar.
 */
export function SearchAutocomplete({
  placeholder,
  defaultValue = '',
  onSearch,
  className,
  showButton,
}: {
  placeholder: string
  defaultValue?: string
  onSearch: (q: string) => void
  className?: string
  showButton?: boolean
}) {
  const navigate = useNavigate()
  const listId = useId()
  const [q, setQ] = useState(defaultValue)
  const [results, setResults] = useState<GameSummary[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [loading, setLoading] = useState(false)
  const skipNext = useRef(false)

  // Pide sugerencias 300 ms después de la última tecla
  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false
      return
    }
    const text = q.trim()
    if (text.length < 2) {
      setResults([])
      return
    }
    let cancelled = false
    const timer = setTimeout(() => {
      setLoading(true)
      api
        .searchGames(text, 8)
        .then((r) => {
          if (cancelled) return
          setResults(r)
          setActive(-1)
          setOpen(true)
        })
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setLoading(false))
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [q])

  const close = () => {
    setOpen(false)
    setActive(-1)
  }

  const pick = (game: GameSummary) => {
    close()
    skipNext.current = true
    setQ('')
    navigate(`/games/${game.gameId}`)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (open && active >= 0 && results[active]) return pick(results[active])
    close()
    onSearch(q.trim())
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && results.length) {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp' && results.length) {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1))
    } else if (e.key === 'Escape') {
      close()
    }
  }

  const showList = open && q.trim().length >= 2 && (results.length > 0 || !loading)

  return (
    <form className={`autocomplete ${className ?? ''}`} onSubmit={submit} role="search">
      <div className="autocomplete-field">
        <input
          className="input"
          type="search"
          placeholder={placeholder}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onKeyDown={onKeyDown}
          onFocus={() => results.length && setOpen(true)}
          onBlur={() => setTimeout(close, 120)}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-label={placeholder}
        />
        {showList && (
          <ul id={listId} className="autocomplete-list" role="listbox">
            {results.length === 0 ? (
              <li className="autocomplete-empty">Sin sugerencias para “{q.trim()}”.</li>
            ) : (
              results.map((g, i) => (
                <li
                  key={g.gameId}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={`autocomplete-item${i === active ? ' active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(g)}
                >
                  {g.coverUrl ? (
                    <img src={igdbSize(g.coverUrl, 'cover_small')} alt="" />
                  ) : (
                    <span className="autocomplete-thumb" />
                  )}
                  <span className="autocomplete-name">{g.name}</span>
                  <span className="small faint">{g.released?.slice(0, 4)}</span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      {showButton && (
        <button className="btn btn-primary" type="submit">
          Buscar
        </button>
      )}
    </form>
  )
}
