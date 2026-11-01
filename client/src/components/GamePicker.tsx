import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { api } from '../api/client'
import type { GameSummary } from '../api/types'
import { igdbSize } from './GameCard'
import { useLang } from '../i18n/LanguageContext'

/**
 * Buscador de juegos para elegir uno (sin navegar): escribe, aparecen sugerencias con portada
 * y al elegir una se llama a onPick. ↑/↓ para moverse, Enter para elegir.
 */
export function GamePicker({
  onPick,
  disabled,
  placeholder,
  autoFocus,
}: {
  onPick: (game: GameSummary) => void
  disabled?: boolean
  placeholder?: string
  autoFocus?: boolean
}) {
  const listId = useId()
  const { t } = useLang()
  const [q, setQ] = useState('')
  const [items, setItems] = useState<GameSummary[]>([])
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus && !disabled) input.current?.focus()
  }, [autoFocus, disabled])

  useEffect(() => {
    const text = q.trim()
    if (text.length < 2) {
      setItems([])
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const games = await api.searchGames(text, 8)
        if (!cancelled) {
          setItems(games)
          setActive(0)
        }
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [q])

  const pick = (game: GameSummary) => {
    onPick(game)
    setQ('')
    setItems([])
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(items.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter' && items[active]) {
      e.preventDefault()
      pick(items[active])
    }
  }

  return (
    <div className="game-picker">
      <input
        ref={input}
        className="input"
        placeholder={placeholder ?? t('Busca un juego…', 'Search for a game…')}
        autoComplete="off"
        spellCheck={false}
        value={q}
        disabled={disabled}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={items.length > 0}
        aria-controls={listId}
      />
      {loading && <span className="game-picker-loading">{t('Buscando…', 'Searching…')}</span>}
      {items.length > 0 && !disabled && (
        <ul className="game-picker-list" id={listId} role="listbox">
          {items.map((g, i) => (
            <li
              key={g.gameId}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'active' : ''}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                pick(g)
              }}
            >
              {g.coverUrl ? <img src={igdbSize(g.coverUrl, 'cover_small')} alt="" /> : <span className="thumb" />}
              <span>
                {g.name}
                {g.released && <small> ({g.released.slice(0, 4)})</small>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
