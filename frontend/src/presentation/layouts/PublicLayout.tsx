import { Outlet } from 'react-router-dom';
import { PublicHeader } from '../components/PublicHeader';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <PublicHeader />
      <Outlet />
      <footer className="mt-20 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <span>© {new Date().getFullYear()} INMO360 · La Paz, Bolivia</span>
          <span>Encuentra un lugar para cada nuevo comienzo.</span>
        </div>
      </footer>
    </div>
  );
}
