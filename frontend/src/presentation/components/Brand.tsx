import { Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Brand({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  return (
    <Link to="/" className={`brand-mark ${inverse ? 'text-white' : 'text-ink'}`} aria-label="INMO360 inicio">
      <span className="brand-icon"><Building2 size={20} strokeWidth={2.2} /></span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[17px] font-extrabold tracking-[-0.06em]">INMO<span className="text-electric">360</span></span>
          <span className={`block text-[8px] font-bold uppercase tracking-[0.23em] ${inverse ? 'text-white/55' : 'text-slate-400'}`}>Real estate · La Paz</span>
        </span>
      )}
    </Link>
  );
}
