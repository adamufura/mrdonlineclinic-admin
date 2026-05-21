import { useEffect, useRef, useState } from 'react';
import {
  ExternalLink,
  HelpCircle,
  LayoutDashboard,
  Menu,
  ScrollText,
  Stethoscope,
  Users,
  UsersRound,
  X,
} from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { toast } from 'sonner';
import { GlobalSearch } from '@/components/admin/global-search';
import { DualBrandMark } from '@/components/brand/DualBrandMark';
import { MINISTRY_FULL_NAME } from '@/config/ministry';
import { usePermissions } from '@/hooks/usePermissions';
import { labelAdminRole } from '@/lib/i18n/admin-labels';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Button } from '@/components/ui/button';
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

function SidebarNav({
  onNavigate,
  can,
}: {
  onNavigate?: () => void;
  can: (p: import('@/lib/rbac').AdminPermission) => boolean;
}) {
  const { t } = useTranslation();
  return (
    <>
      <div className="px-2 pb-2">
        <div className="mb-2 px-2 pt-1 pb-4">
          <Link to={ROUTES.dashboard} className="block" onClick={onNavigate}>
            <DualBrandMark variant="sidebar" />
          </Link>
        </div>

        <p className="px-3 pb-1.5 pt-3 text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">{t('nav.operations')}</p>
        <nav className="flex flex-col gap-0.5">
          <NavRow to={ROUTES.dashboard} label={t('nav.dashboard')} icon={LayoutDashboard} onNavigate={onNavigate} end />
          {can('practitioners:read') ? (
            <NavRow to={ROUTES.practitioners} label={t('nav.practitioners')} icon={Stethoscope} onNavigate={onNavigate} />
          ) : null}
          {can('patients:read') ? (
            <NavRow to={ROUTES.patients} label={t('nav.patients')} icon={Users} onNavigate={onNavigate} />
          ) : null}
          {can('audit:read') ? (
            <NavRow to={ROUTES.audit} label={t('nav.audit')} icon={ScrollText} onNavigate={onNavigate} />
          ) : null}
        </nav>
      </div>

      {can('admins:read') ? (
        <div className="px-2 pb-2">
          <p className="px-3 pb-1.5 pt-3 text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
            {t('nav.administration')}
          </p>
          <nav className="flex flex-col gap-0.5">
            <NavRow to={ROUTES.team} label={t('nav.team')} icon={UsersRound} onNavigate={onNavigate} />
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
  const { t } = useTranslation();
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
            {t('auth.logout')}
          </Button>
        </div>
      </div>
    </div>
  );
}

const sidebarShell =
  'relative flex h-dvh w-[260px] shrink-0 flex-col gap-2 overflow-y-auto bg-gradient-to-b from-[#04132a] to-[#0a2545] px-[18px] pb-6 pt-6 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_60%_30%_at_50%_0%,rgba(56,189,248,0.15),transparent_70%),radial-gradient(ellipse_50%_30%_at_50%_100%,rgba(94,234,212,0.1),transparent_70%)]';

export function DashboardLayout() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { can } = usePermissions();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const mainApp = getMainAppUrl();

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() || user.email : t('admin.layout.staffFallback');
  const subtitle = user?.adminRole ? labelAdminRole(user.adminRole) : MINISTRY_FULL_NAME;
  const initial = (user?.firstName?.[0] ?? user?.email?.[0] ?? 'A').toUpperCase();

  async function performLogout() {
    setLogoutBusy(true);
    try {
      await logout();
      toast.success(t('admin.layout.signedOut'));
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
          <SidebarNav can={can} />
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
            aria-label={t('admin.layout.closeMenu')}
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
              <SidebarNav onNavigate={() => setMobileOpen(false)} can={can} />
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
            aria-label={t('admin.layout.openMenu')}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <GlobalSearch inputRef={searchRef} />

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <LanguageSwitcher />
            {mainApp ? (
              <a
                href={mainApp}
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-1.5 rounded-[9px] px-2 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-[#eef1f6] hover:text-foreground sm:inline-flex"
              >
                <ExternalLink className="h-4 w-4" />
                {t('admin.layout.mainApp')}
              </a>
            ) : null}
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-[9px] text-muted-foreground transition-colors hover:bg-[#eef1f6] hover:text-foreground"
              title={t('admin.layout.help')}
            >
              <HelpCircle className="h-[17px] w-[17px]" strokeWidth={2} />
            </button>
            <button
              type="button"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-teal-300 to-sky-400 font-display text-[13px] font-medium text-[#04132a] shadow-[0_0_0_1px_#e2e8f0]"
              title={t('admin.layout.signedIn')}
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
        title={t('admin.layout.logoutTitle')}
        description={t('admin.layout.logoutDescription')}
        confirmLabel={t('admin.layout.logoutConfirm')}
        cancelLabel={t('admin.layout.logoutCancel')}
        variant="destructive"
        busy={logoutBusy}
        onCancel={() => !logoutBusy && setConfirmLogoutOpen(false)}
        onConfirm={performLogout}
      />
    </div>
  );
}
