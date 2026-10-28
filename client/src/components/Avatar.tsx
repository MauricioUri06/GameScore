export function Avatar({
  url,
  name,
  large,
}: {
  url: string | null
  name: string
  large?: boolean
}) {
  const className = `avatar${large ? ' lg' : ''}`
  if (url) return <img className={className} src={url} alt="" />
  return (
    <span className={className} aria-hidden="true">
      {name.charAt(0).toUpperCase()}
    </span>
  )
}
