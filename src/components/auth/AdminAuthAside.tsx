import { Shield } from 'lucide-react';
import { AdminAuthHero } from '@/components/auth/AdminAuthHero';
import { getMainAppUrl } from '@/config/env';
import { cn } from '@/lib/utils/cn';

function BrandMark() {
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-teal-300 to-sky-400 shadow-[0_8px_24px_rgba(56,189,248,0.35)] ring-1 ring-white/25 sm:size-10">
      <Shield className="size-5 text-white" strokeWidth={2.2} aria-hidden />
    </div>
  );
}

export function AdminAuthAside() {
  const mainApp = getMainAppUrl();

  return (
    <aside
      className={cn(
        'relative hidden min-h-0 flex-col justify-between overflow-hidden p-9 text-white lg:p-11',
        'bg-auth-visual md:flex',
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_15%_20%,rgba(94,234,212,0.18),transparent_70%),radial-gradient(ellipse_60%_50%_at_85%_80%,rgba(56,189,248,0.28),transparent_70%),radial-gradient(ellipse_70%_50%_at_50%_110%,rgba(99,102,241,0.18),transparent_60%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45] [mask-image:radial-gradient(ellipse_at_center,black_22%,transparent_70%)]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
        aria-hidden
      />

      <div className="relative z-10 flex items-center gap-2.5">
        <BrandMark />
        {mainApp ? (
          <a href={mainApp} className="font-display text-[1.15rem] font-medium tracking-tight text-white sm:text-xl">
            MRD <span className="font-light text-white/70">Online Clinic</span>
          </a>
        ) : (
          <span className="font-display text-[1.15rem] font-medium tracking-tight text-white sm:text-xl">
            MRD <span className="font-light text-white/70">Admin</span>
          </span>
        )}
      </div>

      <AdminAuthHero />

      <div className="relative z-10 border-t border-white/[0.08] pt-6">
        <p className="max-w-sm font-display text-lg font-light leading-snug text-white/90">
          Operations console for <em className="text-sky-300 not-italic">staff & compliance</em> — same trusted
          clinic brand your patients see.
        </p>
      </div>
    </aside>
  );
}
