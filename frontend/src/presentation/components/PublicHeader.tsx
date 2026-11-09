import { ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/AuthProvider';
import { Brand } from './Brand';

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const roleLinks = user?.role === 'ADMINISTRADOR'
    ? [
      { label: 'Dashboard', to: '/admin' },
      { label: 'Usuarios', to: '/app/users' },
      { label: 'Propiedades', to: '/app/properties' },
      { label: 'Reportes', to: '/app/reports' },
    ]
    : user?.role === 'AGENTE'
      ? [
        { label: 'Mi panel', to: '/agent' },
        { label: 'Propiedades', to: '/app/properties' },
        { label: 'Clientes', to: '/app/clients' },
        { label: 'Visitas', to: '/app/visits' },
        { label: 'Oportunidades', to: '/app/opportunities' },
        { label: 'Operaciones', to: '/app/operations' },
        { label: 'Estadísticas', to: '/app/reports' },
      ]
      : user?.role === 'CLIENTE'
        ? [
          { label: 'Inicio', to: '/' },
          { label: 'Propiedades', to: '/properties' },
          { label: 'Favoritos', to: '/app/favorites' },
          { label: 'Recomendaciones', to: '/app/recommendations' },
          { label: 'Mi cuenta', to: '/app/profile' },
        ]
        : [
          { label: 'Inicio', to: '/' },
          { label: 'Propiedades', to: '/properties' },
        ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/75 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Brand />
        <nav className="hidden items-center gap-5 xl:flex">
          {roleLinks.map(({ label, to }) => (
            <NavLink key={`${label}-${to}`} to={to} className="nav-public">{label}</NavLink>
          ))}
          {!user && <a href="/#about" className="nav-public">Nosotros</a>}
        </nav>
        <div className="hidden items-center gap-3 xl:flex">
          {user ? (
            <button type="button" className="button-quiet" onClick={() => { void signOut(); }}>Cerrar sesión</button>
          ) : (
            <>
              <Link to="/login" className="button-quiet">Iniciar sesión</Link>
              <Link to="/register" className="button-primary !py-2.5">Crear cuenta <ArrowRight size={16} /></Link>
            </>
          )}
        </div>
        <button className="icon-button xl:hidden" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-100 bg-white px-5 py-5 xl:hidden">
          <div className="flex flex-col gap-3">
            {roleLinks.map(({ label, to }) => (
              <Link key={`${label}-${to}`} onClick={() => setOpen(false)} to={to}>{label}</Link>
            ))}
            {!user && <a onClick={() => setOpen(false)} href="/#about">Nosotros</a>}
            {user ? (
              <button className="text-left text-sm text-slate-500" onClick={() => { void signOut(); setOpen(false); }}>Cerrar sesión</button>
            ) : (
              <div className="mt-2 flex gap-2">
                <Link className="button-secondary flex-1" onClick={() => setOpen(false)} to="/login">Iniciar sesión</Link>
                <Link className="button-primary flex-1" onClick={() => setOpen(false)} to="/register">Registrarme</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
