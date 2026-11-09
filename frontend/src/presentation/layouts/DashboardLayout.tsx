import {
  Building2, CalendarDays, ChartNoAxesCombined, ChevronDown, CircleDollarSign,
  ClipboardList, DoorOpen, FileBarChart2, Heart, Home, KeyRound, Menu, MessageSquareText,
  Settings2, Sparkles, Users, UserRound, UserRoundCog, X
} from 'lucide-react';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { roleLabel } from '../../domain/entities/user';
import type { UserRole } from '../../domain/entities/user';
import { useAuth } from '../hooks/AuthProvider';
import { Brand } from '../components/Brand';

interface NavItem { label: string; to: string; icon: LucideIcon }

const navigation: Record<UserRole, NavItem[]> = {
  ADMINISTRADOR: [
    { label: 'Dashboard administrativo', to: '/app', icon: Home },
    { label: 'Usuarios y roles', to: '/app/users', icon: UserRoundCog },
    { label: 'Agentes', to: '/app/agents', icon: Users },
    { label: 'Clientes', to: '/app/clients', icon: UserRound },
    { label: 'Propietarios', to: '/app/owners', icon: KeyRound },
    { label: 'Propiedades', to: '/app/properties', icon: Building2 },
    { label: 'Consultas', to: '/app/inquiries', icon: MessageSquareText },
    { label: 'Visitas', to: '/app/visits', icon: CalendarDays },
    { label: 'Oportunidades', to: '/app/opportunities', icon: Sparkles },
    { label: 'Operaciones', to: '/app/operations', icon: ClipboardList },
    { label: 'Comisiones', to: '/app/commissions', icon: CircleDollarSign },
    { label: 'Reportes', to: '/app/reports', icon: FileBarChart2 },
  ],
  AGENTE: [
    { label: 'Mi panel', to: '/app', icon: Home },
    { label: 'Mis propiedades', to: '/app/properties', icon: Building2 },
    { label: 'Clientes', to: '/app/clients', icon: UserRound },
    { label: 'Propietarios', to: '/app/owners', icon: KeyRound },
    { label: 'Consultas', to: '/app/inquiries', icon: MessageSquareText },
    { label: 'Visitas', to: '/app/visits', icon: CalendarDays },
    { label: 'Oportunidades', to: '/app/opportunities', icon: Sparkles },
    { label: 'Operaciones', to: '/app/operations', icon: ClipboardList },
    { label: 'Comisiones', to: '/app/commissions', icon: CircleDollarSign },
    { label: 'Estadísticas', to: '/app/reports', icon: ChartNoAxesCombined },
  ],
  CLIENTE: [
    { label: 'Mi panel', to: '/app', icon: Home },
    { label: 'Mi perfil', to: '/app/profile', icon: UserRound },
    { label: 'Explorar propiedades', to: '/app/catalog', icon: Building2 },
    { label: 'Recomendaciones', to: '/app/recommendations', icon: Sparkles },
    { label: 'Mis favoritos', to: '/app/favorites', icon: Heart },
    { label: 'Mis visitas', to: '/app/visits', icon: CalendarDays },
    { label: 'Mis preferencias', to: '/app/preferences', icon: Settings2 },
  ],
};

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export function DashboardLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  if (!user) return null;
  const links = navigation[user.role];
  const pageTitle = links.find((item) => item.to === location.pathname)?.label ?? 'INMO360';

  const sidebar = (
    <>
      <div className="flex h-[78px] items-center justify-between px-6">
        <Brand inverse />
        <button className="icon-button text-white/60 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú"><X size={19} /></button>
      </div>
      <div className="mx-5 mb-5 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">Espacio de trabajo</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-white/90">{roleLabel[user.role]}</span><ChevronDown size={14} className="text-white/45" />
        </div>
      </div>
      <nav className="dashboard-nav flex-1 space-y-1 overflow-y-auto px-3 pb-5">
        {links.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `dashboard-nav-link ${isActive ? 'dashboard-nav-link-active' : ''}`}
          >
            <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <Link to="/" className="dashboard-nav-link"><DoorOpen size={17} /><span>Portal público</span></Link>
        <button
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-white/55 transition hover:bg-white/10 hover:text-white"
          onClick={async () => { await signOut(); navigate('/login'); }}
        >
          <X size={16} /><span>Cerrar sesión</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] flex-col bg-[#10233f] text-white lg:flex">{sidebar}</aside>
      {mobileOpen && <div className="fixed inset-0 z-50 bg-slate-950/45 lg:hidden" onClick={() => setMobileOpen(false)}><aside className="flex h-full w-[282px] flex-col bg-[#10233f]" onClick={(event) => event.stopPropagation()}>{sidebar}</aside></div>}
      <div className="min-h-screen lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200/75 bg-white/90 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <button className="icon-button lg:hidden" aria-label="Abrir navegación" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
            <div><p className="hidden text-[10px] font-bold uppercase tracking-[0.17em] text-slate-400 sm:block">INMO360 / Workspace</p><p className="text-sm font-bold text-ink">{pageTitle}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-xs font-bold text-ink">{user.fullName}</p><p className="text-[10px] text-slate-400">{roleLabel[user.role]}</p></div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0ff] text-xs font-extrabold text-electric">{initials(user.fullName)}</span>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
