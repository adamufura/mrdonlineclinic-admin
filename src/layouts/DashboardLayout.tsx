import { useEffect, useRef, useState } from 'react';
import {
  ExternalLink,
  HelpCircle,
  LayoutDashboard,
  Menu,
  ScrollText,
  Search,
  Stethoscope,
  Users,
  UsersRound,
  X,
} from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { toast } from 'sonner';
import { BrandMark } from '@/components/brand/BrandMark';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { logout } from '@/features/auth/api';
import { getMainAppUrl } from '@/config/env';
import { normalizeAxiosError } from '@/lib/api/errors';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';

type NavIcon = typeof LayoutDashboard;

function NavRow({
  to,
  label,
  icon: Icon,
  onNavigate,
  end,
}: {
  to: string;
  label: string;
  icon: NavIcon;
  onNavigate?: () => void;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-[13.5px] text-white/70 transition-colors hover:bg-white/5 hover:text-white',
          isActive &&
            'border border-teal-300/20 bg-teal-300/10 text-white before:absolute before:left-[-18px] before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r before:bg-gradient-to-b before:from-teal-300 before:to-sky-400',
        )
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0 opacity-90" strokeWidth={2} />
      <span className="min-w-0 flex-1">{label}</span>
    </NavLink>
  );
}

function SidebarNav({ onNavigate, showTeam }: { onNavigate?: () => void; showTeam: boolean }) {
  return (
    <>
      <div className="px-2 pb-2">
        <div className="mb-2 px-2 pt-1 pb-4">
          <Link to={ROUTES.dashboard} className="flex items-center gap-2.5" onClick={onNavigate}>
            <BrandMark />
            <span className="font-display text-[17px] font-medium tracking-tight text-white">
              MRD <span className="font-light text-white/65">Admin</span>
            </span>
          </Link>
        </div>

        <p className="px-3 pb-1.5 pt-3 text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">Operations</p>
        <nav className="flex flex-col gap-0.5">
          <NavRow to={ROUTES.dashboard} label="Dashboard" icon={LayoutDashboard} onNavigate={onNavigate} end />
          <NavRow to={ROUTES.practitioners} label="Practitioners" icon={Stethoscope} onNavigate={onNavigate} />
          <NavRow to={ROUTES.patients} label="Patients" icon={Users} onNavigate={onNavigate} />
          <NavRow to={ROUTES.audit} label="Audit log" icon={ScrollText} onNavigate={onNavigate} />
        </nav>
      </div>

      {showTeam ? (
        <div className="px-2 pb-2">
          <p className="px-3 pb-1.5 pt-3 text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
            Super admin
          </p>
          <nav className="flex flex-col gap-0.5">
            <NavRow to={ROUTES.team} label="Team & invites" icon={UsersRound} onNavigate={onNavigate} />
          </nav>
        </div>
      ) : null}
    </>
  );
}

function SidebarChrome({
  displayName,
  subtitle,
  initial,
  onRequestLogout,
}: {
  displayName: string;
  subtitle: string;
  initial: string;
  onRequestLogout: () => void;
}) {
  return (
    <div className="mt-auto rounded-xl border border-white/[0.06] bg-white/[0.04] p-3">
      <div className="flex gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-300 to-sky-400 font-display text-[13px] font-medium text-[#04132a]">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-white">{displayName}</p>
            <p className="truncate text-[11px] text-white/55">{subtitle}</p>
          </div>
          <Button
            variant="ghost"
            type="button"
            className="mt-2 h-8 w-full justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[12px] font-medium text-white/85 hover:bg-white/10 hover:text-white"
            onClick={onRequestLogout}
          >
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}

const sidebarShell =
  'relative flex h-dvh w-[260px] shrink-0 flex-col gap-2 overflow-y-auto bg-gradient-to-b from-[#04132a] to-[#0a2545] px-[18px] pb-6 pt-6 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_60%_30%_at_50%_0%,rgba(56,189,248,0.15),transparent_70%),radial-gradient(ellipse_50%_30%_at_50%_100%,rgba(94,234,212,0.1),transparent_70%)]';

export function DashboardLayout() {
  const user = useAuthStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const mainApp = getMainAppUrl();

  const showTeam = user?.adminRole === 'SUPER_ADMIN';
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() || user.email : 'Admin';
  const subtitle =
    user?.adminRole === 'SUPER_ADMIN' ? 'Super administrator' : user?.adminRole === 'ADMIN' ? 'Administrator' : 'Console';
  const initial = (user?.firstName?.[0] ?? user?.email?.[0] ?? 'A').toUpperCase();

  async function performLogout() {
    setLogoutBusy(true);
    try {
      await logout();
      toast.success('Signed out');
      window.location.assign(ROUTES.login);
    } catch (e) {
      toast.error(normalizeAxiosError(e).message);
    } finally {
      setLogoutBusy(false);
      setConfirmLogoutOpen(false);
    }
  }

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative h-dvh overflow-hidden bg-[#f7f8fb] text-foreground">
      <aside className={cn(sidebarShell, 'fixed left-0 top-0 z-40 hidden lg:flex')}>
        <div className="relative z-[1] flex min-h-0 flex-1 flex-col gap-2">
          <SidebarNav showTeam={showTeam} />
          <SidebarChrome
            displayName={displayName}
            subtitle={subtitle}
            initial={initial}
            onRequestLogout={() => setConfirmLogoutOpen(true)}
          />
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className={cn(sidebarShell, 'absolute left-0 top-0 flex h-full max-w-[85vw] shadow-2xl')}>
            <div className="relative z-[1] flex min-h-0 flex-1 flex-col gap-2">
              <div className="flex justify-end px-1">
                <button
                  type="button"
                  className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarNav onNavigate={() => setMobileOpen(false)} showTeam={showTeam} />
              <SidebarChrome
                displayName={displayName}
                subtitle={subtitle}
                initial={initial}
                onRequestLogout={() => setConfirmLogoutOpen(true)}
              />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex h-dvh min-h-0 flex-col overflow-hidden lg:pl-[260px]">
        <header className="fixed left-0 right-0 top-0 z-30 flex h-[60px] items-center gap-4 border-b border-[#e2e8f0] bg-white/85 px-4 backdrop-blur-xl lg:left-[260px] lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden"
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="relative min-w-0 flex-1 max-lg:max-w-none lg:max-w-[460px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              type="search"
              placeholder="Search practitioners, patients, or audit targets…"
              className="h-9 border-[#e2e8f0] bg-[#eef1f6] pl-9 pr-14 text-[13px] shadow-none focus-visible:border-teal-500 focus-visible:bg-white focus-visible:ring-teal-500/20"
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-[#e2e8f0] bg-white px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
              ⌘K
            </kbd>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {mainApp ? (
              <a
                href={mainApp}
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-1.5 rounded-[9px] px-2 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-[#eef1f6] hover:text-foreground sm:inline-flex"
              >
                <ExternalLink className="h-4 w-4" />
                Main app
              </a>
            ) : null}
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-[9px] text-muted-foreground transition-colors hover:bg-[#eef1f6] hover:text-foreground"
              title="Help"
            >
              <HelpCircle className="h-[17px] w-[17px]" strokeWidth={2} />
            </button>
            <button
              type="button"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-teal-300 to-sky-400 font-display text-[13px] font-medium text-[#04132a] shadow-[0_0_0_1px_#e2e8f0]"
              title="Signed in"
            >
              {initial}
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pt-[60px] [-webkit-overflow-scrolling:touch]">
          <div className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8 lg:py-7">
            <Outlet />
          </div>
        </main>
      </div>

      <ConfirmModal
        open={confirmLogoutOpen}
        title="Log out of MRD Admin?"
        description="You will be signed out on this device. You can sign back in anytime."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        variant="destructive"
        busy={logoutBusy}
        onCancel={() => !logoutBusy && setConfirmLogoutOpen(false)}
        onConfirm={performLogout}
      />
    </div>
  );
}
