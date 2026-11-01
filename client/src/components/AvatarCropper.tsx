import { useEffect, useRef, useState, type PointerEvent } from 'react'

const VIEW = 260 // tamaño del recuadro de recorte en pantalla (px)
const OUTPUT = 256 // tamaño final de la foto (px)

interface Props {
  file: File
  onCancel: () => void
  onConfirm: (image: Blob) => void
}

/**
 * Recorte de foto de perfil: arrastra para encuadrar y usa el zoom para agrandar.
 * El círculo muestra lo que se verá en el perfil; se guarda como JPEG cuadrado de 256×256.
 */
export function AvatarCropper({ file, onCancel, onConfirm }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 }) // esquina superior izquierda de la imagen
  const drag = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null)

  // Cargar la imagen elegida
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      setImg(image)
      setUrl(objectUrl)
      // Empieza centrada y cubriendo el recuadro
      const base = VIEW / Math.min(image.naturalWidth, image.naturalHeight)
      setOffset({
        x: (VIEW - image.naturalWidth * base) / 2,
        y: (VIEW - image.naturalHeight * base) / 2,
      })
    }
    image.onerror = () => setError('No se pudo leer la imagen. Prueba con un JPG o PNG.')
    image.src = objectUrl
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  if (error) {
    return (
      <div className="cropper">
        <div className="alert">{error}</div>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Volver
        </button>
      </div>
    )
  }
  if (!img || !url) return <div className="cropper">Cargando imagen…</div>

  const base = VIEW / Math.min(img.naturalWidth, img.naturalHeight)
  const width = img.naturalWidth * base * zoom
  const height = img.naturalHeight * base * zoom

  // La imagen siempre debe cubrir todo el recuadro
  const clamp = (x: number, y: number, w = width, h = height) => ({
    x: Math.min(0, Math.max(VIEW - w, x)),
    y: Math.min(0, Math.max(VIEW - h, y)),
  })
  const pos = clamp(offset.x, offset.y)

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { startX: e.clientX, startY: e.clientY, ox: pos.x, oy: pos.y }
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const d = drag.current
    setOffset(clamp(d.ox + e.clientX - d.startX, d.oy + e.clientY - d.startY))
  }
  const onPointerUp = () => {
    drag.current = null
  }

  // Zoom manteniendo fijo el centro del recuadro
  const changeZoom = (next: number) => {
    const nw = img.naturalWidth * base * next
    const nh = img.naturalHeight * base * next
    const cx = (VIEW / 2 - pos.x) / width // punto de la imagen en el centro (0..1)
    const cy = (VIEW / 2 - pos.y) / height
    setZoom(next)
    setOffset(clamp(VIEW / 2 - cx * nw, VIEW / 2 - cy * nh, nw, nh))
  }

  const confirm = () => {
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT
    canvas.height = OUTPUT
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const k = OUTPUT / VIEW
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, pos.x * k, pos.y * k, width * k, height * k)
    canvas.toBlob((blob) => blob && onConfirm(blob), 'image/jpeg', 0.88)
  }

  return (
    <div className="cropper">
      <p className="muted small" style={{ margin: 0 }}>
        Arrastra para encuadrar y usa el zoom para agrandar.
      </p>
      <div
        className="cropper-view"
        style={{ width: VIEW, height: VIEW }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          src={url}
          alt=""
          draggable={false}
          style={{ width, height, transform: `translate(${pos.x}px, ${pos.y}px)` }}
        />
        <div className="cropper-mask" aria-hidden="true" />
      </div>
      <label className="cropper-zoom">
        <span className="small muted">Zoom</span>
        <input
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(e) => changeZoom(Number(e.target.value))}
        />
      </label>
      <div className="row" style={{ justifyContent: 'center' }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className="btn btn-primary" onClick={confirm}>
          Usar esta foto
        </button>
      </div>
    </div>
  )
}
