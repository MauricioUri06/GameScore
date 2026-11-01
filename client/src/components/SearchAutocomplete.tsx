import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { GameSummary, UserSearchResult } from '../api/types'
import { Avatar } from './Avatar'
import { igdbSize } from './GameCard'
import { useLang } from '../i18n/LanguageContext'

type Suggestion = { kind: 'game'; game: GameSummary } | { kind: 'user'; user: UserSearchResult }

/**
 * Buscador con autocompletado de juegos y usuarios.
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
  const { t } = useLang()
  const navigate = useNavigate()
  const listId = useId()
  const [q, setQ] = useState(defaultValue)
  const [items, setItems] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [loading, setLoading] = useState(false)
  const skipNext = useRef(false)

  // Pide sugerencias 300 ms después de la última tecla (juegos y usuarios a la vez)
  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false
      return
    }
    const text = q.trim()
    if (text.length < 2) {
      setItems([])
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      setLoading(true)
      const [games, users] = await Promise.allSettled([api.searchGames(text, 6), api.searchUsers(text, 4)])
      if (cancelled) return
      setItems([
        ...(games.status === 'fulfilled' ? games.value : []).map((game) => ({ kind: 'game' as const, game })),
        ...(users.status === 'fulfilled' ? users.value : []).map((user) => ({ kind: 'user' as const, user })),
      ])
      setActive(-1)
      setOpen(true)
      setLoading(false)
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

  const pick = (item: Suggestion) => {
    close()
    skipNext.current = true
    setQ('')
    navigate(item.kind === 'game' ? `/games/${item.game.gameId}` : `/u/${item.user.userName}`)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (open && active >= 0 && items[active]) return pick(items[active])
    close()
    onSearch(q.trim())
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && items.length) {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (i + 1) % items.length)
    } else if (e.key === 'ArrowUp' && items.length) {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1))
    } else if (e.key === 'Escape') {
      close()
    }
  }

  const showList = open && q.trim().length >= 2 && (items.length > 0 || !loading)
  const firstUser = items.findIndex((i) => i.kind === 'user')

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
          onFocus={() => items.length && setOpen(true)}
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
            {items.length === 0 ? (
              <li className="autocomplete-empty">
                {t(`Sin resultados para “${q.trim()}”.`, `No results for “${q.trim()}”.`)}
              </li>
            ) : (
              items.map((item, i) => (
                <SuggestionRow
                  key={item.kind === 'game' ? `g-${item.game.gameId}` : `u-${item.user.userName}`}
                  id={`${listId}-${i}`}
                  item={item}
                  active={i === active}
                  heading={
                    i === 0 && item.kind === 'game'
                      ? t('Juegos', 'Games')
                      : i === firstUser
                        ? t('Usuarios', 'Users')
                        : undefined
                  }
                  onHover={() => setActive(i)}
                  onPick={() => pick(item)}
                />
              ))
            )}
          </ul>
        )}
      </div>
      {showButton && (
        <button className="btn btn-primary" type="submit">
          {t('Buscar', 'Search')}
        </button>
      )}
    </form>
  )
}

function SuggestionRow({
  id,
  item,
  active,
  heading,
  onHover,
  onPick,
}: {
  id: string
  item: Suggestion
  active: boolean
  heading?: string
  onHover: () => void
  onPick: () => void
}) {
  const { t } = useLang()
  return (
    <>
      {heading && (
        <li className="autocomplete-heading" role="presentation">
          {heading}
        </li>
      )}
      <li
        id={id}
        role="option"
        aria-selected={active}
        className={`autocomplete-item${active ? ' active' : ''}`}
        onMouseDown={(e) => e.preventDefault()}
        onMouseEnter={onHover}
        onClick={onPick}
      >
        {item.kind === 'game' ? (
          <>
            {item.game.coverUrl ? (
              <img src={igdbSize(item.game.coverUrl, 'cover_small')} alt="" />
            ) : (
              <span className="autocomplete-thumb" />
            )}
            <span className="autocomplete-name">{item.game.name}</span>
            <span className="small faint">{item.game.released?.slice(0, 4)}</span>
          </>
        ) : (
          <>
            <Avatar name={item.user.userName} url={item.user.avatarUrl} />
            <span className="autocomplete-name">{item.user.userName}</span>
            <span className="small faint">
              {item.user.ratings}{' '}
              {item.user.ratings === 1 ? t('calificación', 'rating') : t('calificaciones', 'ratings')}
            </span>
          </>
        )}
      </li>
    </>
  )
}
