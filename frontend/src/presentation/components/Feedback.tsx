import { AlertCircle, LoaderCircle, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';

export function LoadingState({ label = 'Cargando información…' }: { label?: string }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-3 text-sm text-slate-500">
      <LoaderCircle className="animate-spin text-electric" size={25} />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="panel flex flex-col items-center gap-3 px-6 py-10 text-center">
      <AlertCircle className="text-rose-500" size={28} />
      <p className="max-w-lg text-sm text-slate-600">{message}</p>
      {retry && <button className="button-secondary" onClick={retry}>Volver a intentar</button>}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="panel flex min-h-52 flex-col items-center justify-center gap-2 px-6 text-center">
      <SearchX className="text-slate-300" size={30} />
      <p className="font-semibold text-ink">{title}</p>
      {children && <div className="max-w-lg text-sm text-slate-500">{children}</div>}
    </div>
  );
}
