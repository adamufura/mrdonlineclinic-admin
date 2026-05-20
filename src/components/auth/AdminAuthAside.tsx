import { AdminAuthHero } from '@/components/auth/AdminAuthHero';
import { DualBrandMark } from '@/components/brand/DualBrandMark';
import { MINISTRY_FULL_NAME } from '@/config/ministry';
import { cn } from '@/lib/utils/cn';

export function AdminAuthAside() {
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

      <div className="relative z-10">
        <DualBrandMark variant="sidebar" />
      </div>

      <AdminAuthHero />

      <div className="relative z-10 border-t border-white/[0.08] pt-6">
        <p className="max-w-sm font-display text-lg font-light leading-snug text-white/90">
          Secure console for <em className="text-sky-300 not-italic">{MINISTRY_FULL_NAME}</em> — oversee telemedicine
          operations across Katsina State.
        </p>
      </div>
    </aside>
  );
}
