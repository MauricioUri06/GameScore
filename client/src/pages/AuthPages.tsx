import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ErrorMessage } from '../components/Status'

function useRedirectAfterAuth() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  return () => navigate(from, { replace: true })
}

/** Campo de clave: solo acepta números y como máximo 6. */
function PinInput({
  id,
  value,
  onChange,
  autoComplete,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
}) {
  return (
    <input
      id={id}
      className="input pin-input"
      type="password"
      inputMode="numeric"
      autoComplete={autoComplete}
      pattern="[0-9]{6}"
      title="6 dígitos"
      maxLength={6}
      required
      placeholder="••••••"
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
    />
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const redirect = useRedirectAfterAuth()
  const [userName, setUserName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(userName.trim(), pin)
      redirect()
    } catch (err) {
      setError(err)
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container page">
      <form className="card auth-card" onSubmit={submit}>
        <h1>Bienvenido de vuelta</h1>
        {error ? <ErrorMessage error={error} /> : null}
        <div className="field">
          <label htmlFor="userName">Nickname</label>
          <input
            id="userName"
            className="input"
            autoComplete="username"
            required
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="pin">Clave de 6 dígitos</label>
          <PinInput id="pin" value={pin} onChange={setPin} autoComplete="current-password" />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading || pin.length !== 6}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="small muted" style={{ textAlign: 'center', marginBottom: 0 }}>
          ¿No tienes cuenta? <Link to="/register">Crea una</Link>
        </p>
      </form>
    </div>
  )
}

export function RegisterPage() {
  const { register } = useAuth()
  const redirect = useRedirectAfterAuth()
  const [userName, setUserName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  const mismatch = pinConfirm.length === 6 && pin !== pinConfirm

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (pin !== pinConfirm) return
    setLoading(true)
    setError(null)
    try {
      await register({
        userName: userName.trim(),
        pin,
        displayName: displayName.trim() || undefined,
      })
      redirect()
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container page">
      <form className="card auth-card" onSubmit={submit}>
        <h1>Crea tu cuenta</h1>
        {error ? <ErrorMessage error={error} /> : null}
        <div className="field">
          <label htmlFor="userName">Nickname</label>
          <input
            id="userName"
            className="input"
            autoComplete="username"
            required
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9_.\-]+"
            title="Letras, números, '_', '.' y '-'"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <span className="hint">Será tu dirección: /u/{userName || 'nickname'}</span>
        </div>
        <div className="field">
          <label htmlFor="displayName">Nombre visible (opcional)</label>
          <input
            id="displayName"
            className="input"
            maxLength={50}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="pin">Clave de 6 dígitos</label>
          <PinInput id="pin" value={pin} onChange={setPin} autoComplete="new-password" />
        </div>
        <div className="field">
          <label htmlFor="pinConfirm">Repite la clave</label>
          <PinInput id="pinConfirm" value={pinConfirm} onChange={setPinConfirm} autoComplete="new-password" />
          {mismatch && <span className="hint" style={{ color: 'var(--danger)' }}>Las claves no coinciden.</span>}
        </div>
        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={loading || pin.length !== 6 || pin !== pinConfirm}
        >
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
        <p className="small muted" style={{ textAlign: 'center', marginBottom: 0 }}>
          ¿Ya tienes cuenta? <Link to="/login">Entra</Link>
        </p>
      </form>
    </div>
  )
}
