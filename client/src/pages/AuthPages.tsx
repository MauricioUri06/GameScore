import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ErrorMessage } from '../components/Status'
import { useLang } from '../i18n/LanguageContext'

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
  const { t } = useLang()
  return (
    <input
      id={id}
      name={id}
      className="input pin-input"
      type="password"
      inputMode="numeric"
      autoComplete={autoComplete}
      pattern="[0-9]{6}"
      title={t('6 dígitos', '6 digits')}
      maxLength={6}
      required
      placeholder="••••••"
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
    />
  )
}

export function LoginPage() {
  const { t } = useLang()
  const { login } = useAuth()
  const redirect = useRedirectAfterAuth()
  const [userName, setUserName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Leemos los valores directamente del formulario: si el navegador autocompletó
    // el nickname o la clave, puede que React no se haya enterado todavía.
    const form = new FormData(e.currentTarget)
    const name = String(form.get('userName') ?? userName).trim()
    const digits = String(form.get('pin') ?? pin).replace(/\D/g, '')

    if (!name) {
      setError(new Error(t('Escribe tu nickname.', 'Enter your nickname.')))
      return
    }
    if (digits.length !== 6) {
      setError(new Error(t('La clave debe tener 6 dígitos.', 'The PIN must have 6 digits.')))
      return
    }

    setLoading(true)
    setError(null)
    try {
      await login(name, digits)
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
      <form className="card auth-card" onSubmit={submit} noValidate>
        <h1>{t('Bienvenido de vuelta', 'Welcome back')}</h1>
        {error ? <ErrorMessage error={error} /> : null}
        <div className="field">
          <label htmlFor="userName">Nickname</label>
          <input
            id="userName"
            name="userName"
            className="input"
            autoComplete="username"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="pin">{t('Clave de 6 dígitos', '6-digit PIN')}</label>
          <PinInput id="pin" value={pin} onChange={setPin} autoComplete="current-password" />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? t('Entrando…', 'Logging in…') : t('Entrar', 'Log in')}
        </button>
        <p className="small muted" style={{ textAlign: 'center', marginBottom: 0 }}>
          {t('¿No tienes cuenta?', "Don't have an account?")} <Link to="/register">{t('Crea una', 'Create one')}</Link>
        </p>
      </form>
    </div>
  )
}

export function RegisterPage() {
  const { t } = useLang()
  const { register } = useAuth()
  const redirect = useRedirectAfterAuth()
  const [userName, setUserName] = useState('')
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
      await register({ userName: userName.trim(), pin })
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
        <h1>{t('Crea tu cuenta', 'Create your account')}</h1>
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
            title={t("Letras, números, '_', '.' y '-'", "Letters, numbers, '_', '.' and '-'")}
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <span className="hint">
            {t(
              'Es el nombre que verá la comunidad. Tu perfil:',
              'This is the name the community will see. Your profile:',
            )}{' '}
            /u/
            {userName || 'nickname'}
          </span>
        </div>
        <div className="field">
          <label htmlFor="pin">{t('Clave de 6 dígitos', '6-digit PIN')}</label>
          <PinInput id="pin" value={pin} onChange={setPin} autoComplete="new-password" />
        </div>
        <div className="field">
          <label htmlFor="pinConfirm">{t('Repite la clave', 'Repeat the PIN')}</label>
          <PinInput id="pinConfirm" value={pinConfirm} onChange={setPinConfirm} autoComplete="new-password" />
          {mismatch && (
            <span className="hint" style={{ color: 'var(--danger)' }}>
              {t('Las claves no coinciden.', "The PINs don't match.")}
            </span>
          )}
        </div>
        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={loading || pin.length !== 6 || pin !== pinConfirm}
        >
          {loading ? t('Creando cuenta…', 'Creating account…') : t('Crear cuenta', 'Create account')}
        </button>
        <p className="small muted" style={{ textAlign: 'center', marginBottom: 0 }}>
          {t('¿Ya tienes cuenta?', 'Already have an account?')} <Link to="/login">{t('Entra', 'Log in')}</Link>
        </p>
      </form>
    </div>
  )
}
