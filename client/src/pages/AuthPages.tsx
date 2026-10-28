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

export function LoginPage() {
  const { login } = useAuth()
  const redirect = useRedirectAfterAuth()
  const [userNameOrEmail, setUserNameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(userNameOrEmail.trim(), password)
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
        <h1>Bienvenido de vuelta</h1>
        {error ? <ErrorMessage error={error} /> : null}
        <div className="field">
          <label htmlFor="login">Usuario o correo</label>
          <input
            id="login"
            className="input"
            autoComplete="username"
            required
            value={userNameOrEmail}
            onChange={(e) => setUserNameOrEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
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
  const [form, setForm] = useState({ userName: '', displayName: '', email: '', password: '' })
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  const update = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await register({
        userName: form.userName.trim(),
        email: form.email.trim(),
        password: form.password,
        displayName: form.displayName.trim() || undefined,
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
          <label htmlFor="userName">Nombre de usuario</label>
          <input
            id="userName"
            className="input"
            autoComplete="username"
            required
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9_.\-]+"
            title="Letras, números, '_', '.' y '-'"
            value={form.userName}
            onChange={update('userName')}
          />
          <span className="hint">Será tu dirección: /u/{form.userName || 'usuario'}</span>
        </div>
        <div className="field">
          <label htmlFor="displayName">Nombre visible (opcional)</label>
          <input id="displayName" className="input" maxLength={50} value={form.displayName} onChange={update('displayName')} />
        </div>
        <div className="field">
          <label htmlFor="email">Correo</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={update('email')}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={form.password}
            onChange={update('password')}
          />
          <span className="hint">Mínimo 8 caracteres, con al menos una minúscula y un número.</span>
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
        <p className="small muted" style={{ textAlign: 'center', marginBottom: 0 }}>
          ¿Ya tienes cuenta? <Link to="/login">Entra</Link>
        </p>
      </form>
    </div>
  )
}
