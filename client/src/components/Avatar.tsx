import { useState } from 'react'

/** Foto de perfil; si no hay (o no carga), un círculo con la inicial del nickname. */
export function Avatar({ name, url, large }: { name: string; url?: string | null; large?: boolean }) {
  const [failed, setFailed] = useState<string | null>(null)
  const className = `avatar${large ? ' lg' : ''}`

  if (url && failed !== url) {
    return <img className={className} src={url} alt="" onError={() => setFailed(url)} />
  }
  return (
    <span className={className} aria-hidden="true">
      {name.charAt(0).toUpperCase()}
    </span>
  )
}
