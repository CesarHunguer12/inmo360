import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../infrastructure/api/http-client';
import { Brand } from '../components/Brand';
import { useAuth } from '../hooks/AuthProvider';

export function LoginPage() {
  const { user, signIn, loading, sessionError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  if (!loading && user) return <Navigate to="/app" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate('/app', { replace: true });
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="auth-visual-grid" />
        <Link to="/" className="absolute left-7 top-7 text-white/65 transition hover:text-white"><ArrowLeft size={20} /></Link>
        <div className="relative z-10 mx-auto max-w-md px-8 py-16">
          <Brand inverse />
          <div className="mt-24">
            <p className="eyebrow text-sky-300">INMOBILIARIA · LA PAZ</p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.11] tracking-[-0.05em] text-white sm:text-5xl">El próximo paso empieza en un buen lugar.</h1>
            <p className="mt-6 max-w-sm text-sm leading-7 text-white/65">Un espacio pensado para encontrar oportunidades, gestionar propiedades y construir relaciones que llegan más lejos.</p>
          </div>
          <div className="mt-14 flex items-center gap-3 text-xs text-white/55"><ShieldCheck size={17} className="text-sky-300" />Acceso seguro a tu espacio INMO360</div>
        </div>
        <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full border border-white/10" />
        <div className="absolute -bottom-14 -right-6 h-52 w-52 rounded-full border border-white/10" />
      </section>
      <section className="flex min-h-[calc(100vh-0px)] items-center justify-center px-6 py-14 sm:px-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-11 lg:hidden"><Brand /></div>
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf1ff] text-electric"><KeyRound size={21} /></div>
          <p className="eyebrow">BIENVENIDO DE NUEVO</p>
          <h2 className="mt-2 text-[32px] font-bold tracking-[-0.045em] text-ink">Inicia sesión</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Ingresa tus datos para continuar a tu espacio de trabajo.</p>
          {sessionError && <div role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{sessionError}</div>}
          <form className="mt-8 space-y-5" onSubmit={submit}>
            <label className="form-label">Correo electrónico
              <input className="form-input" type="email" autoComplete="email" placeholder="tu@correo.com" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="form-label">Contraseña
              <span className="relative block">
                <input className="form-input pr-12" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Tu contraseña" required maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-ink" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </span>
            </label>
            {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            <button disabled={submitting} className="button-primary w-full !py-3.5 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? 'Validando acceso…' : 'Entrar a mi espacio'} {!submitting && <ArrowRight size={17} />}
            </button>
          </form>
          <p className="mt-7 text-center text-sm text-slate-500">¿Aún no tienes cuenta? <Link to="/register" className="font-bold text-electric hover:underline">Regístrate</Link></p>
          <p className="mt-12 text-center text-[11px] text-slate-400">Al ingresar, tu rol y permisos se validan de forma segura en el servidor.</p>
        </div>
      </section>
    </main>
  );
}
