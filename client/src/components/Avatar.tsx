/** Avatar con la inicial del nombre. */
export function Avatar({ name, large }: { name: string; large?: boolean }) {
  return (
    <span className={`avatar${large ? ' lg' : ''}`} aria-hidden="true">
      {name.charAt(0).toUpperCase()}
    </span>
  )
}
