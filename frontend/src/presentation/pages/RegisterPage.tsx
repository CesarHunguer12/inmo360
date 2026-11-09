import { ArrowLeft, ArrowRight, Eye, EyeOff, UserRoundPlus } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../infrastructure/api/http-client';
import { registrationPasswordError } from '../../application/use-cases/registration-password';
import { Brand } from '../components/Brand';
import { useAuth } from '../hooks/AuthProvider';

export function RegisterPage() {
  const { user, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmationError, setConfirmationError] = useState('');
  const [success, setSuccess] = useState(false);
  if (!loading && user) return <Navigate to="/app" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');
    setConfirmationError('');
    const invalidPassword = registrationPasswordError(password);
    if (invalidPassword) {
      setPasswordError(invalidPassword);
      return;
    }
    if (password !== confirmPassword) {
      setConfirmationError('Las contraseñas no coinciden.');
      return;
    }
    setSubmitting(true);
    try {
      await signUp({ fullName, email, password, ...(phone.trim() ? { phone: phone.trim() } : {}) });
      setSuccess(true);
      window.setTimeout(() => navigate('/login', { replace: true }), 1400);
    } catch (reason) {
      const message = getErrorMessage(reason);
      if (/ya existe|duplicad|correo electrónico/i.test(message)) setEmailError(message);
      else if (/contraseña|password/i.test(message)) setPasswordError(message);
      else setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-5 py-12">
      <div className="absolute left-6 top-6 sm:left-10 sm:top-8"><Link to="/" className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-electric"><ArrowLeft size={15} />Volver al inicio</Link></div>
      <section className="w-full max-w-[490px] rounded-[26px] border border-slate-200/80 bg-white p-7 shadow-[0_24px_70px_-45px_rgba(16,35,63,.28)] sm:p-10">
        <Brand />
        <div className="mb-7 mt-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf1ff] text-electric"><UserRoundPlus size={21} /></div>
        <p className="eyebrow">COMIENZA AQUÍ</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.045em] text-ink">Crea tu cuenta</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Regístrate como cliente para guardar propiedades y coordinar visitas.</p>
        {success ? (
          <div role="status" className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-800">Tu cuenta se registró correctamente. Te llevaremos al inicio de sesión…</div>
        ) : (
          <form className="mt-7 space-y-5" onSubmit={submit}>
            <label className="form-label">Nombre completo<input className="form-input" required minLength={2} maxLength={120} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>
            <label className="form-label">Correo electrónico<input className={`form-input ${emailError ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : ''}`} required type="email" maxLength={254} autoComplete="email" value={email} aria-invalid={Boolean(emailError)} aria-describedby={emailError ? 'register-email-error' : undefined} onChange={(event) => { setEmail(event.target.value); setEmailError(''); }} />{emailError && <span id="register-email-error" className="mt-1 block text-xs font-normal text-rose-600" role="alert">{emailError}</span>}</label>
            <label className="form-label">Teléfono <span className="font-normal text-slate-400">(opcional)</span><input className="form-input" type="tel" maxLength={30} autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
            <label className="form-label">Contraseña
              <span className="relative block">
                <input id="register-password" className={`form-input pr-12 ${passwordError ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : ''}`} required minLength={12} type={showPassword ? 'text' : 'password'} autoComplete="new-password" aria-invalid={Boolean(passwordError)} aria-describedby={passwordError ? 'register-password-error' : 'register-password-requirement'} value={password} onChange={(event) => { setPassword(event.target.value); setPasswordError(''); }} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-ink" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-controls="register-password">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </span>
              {passwordError ? <span id="register-password-error" className="mt-1 block text-xs font-normal text-rose-600" role="alert">{passwordError}</span> : <span id="register-password-requirement" className="mt-1 block text-[11px] font-normal text-slate-400">Usa una contraseña de al menos 12 caracteres.</span>}
            </label>
            <label className="form-label">Confirmar contraseña
              <span className="relative block">
                <input id="register-password-confirm" className={`form-input pr-12 ${confirmationError ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : ''}`} required type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" aria-invalid={Boolean(confirmationError)} aria-describedby={confirmationError ? 'register-confirm-error' : undefined} value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setConfirmationError(''); }} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-ink" onClick={() => setShowConfirmation((visible) => !visible)} aria-label={showConfirmation ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'} aria-controls="register-password-confirm">{showConfirmation ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </span>
              {confirmationError && <span id="register-confirm-error" className="mt-1 block text-xs font-normal text-rose-600" role="alert">{confirmationError}</span>}
            </label>
            {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            <button disabled={submitting} className="button-primary w-full !py-3.5 disabled:opacity-60">{submitting ? 'Creando cuenta…' : 'Crear mi cuenta'} {!submitting && <ArrowRight size={17} />}</button>
          </form>
        )}
        <p className="mt-7 text-center text-sm text-slate-500">¿Ya tienes una cuenta? <Link to="/login" className="font-bold text-electric">Inicia sesión</Link></p>
      </section>
    </main>
  );
}
