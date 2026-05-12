import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ShieldCheck, Users, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { fetchPlatformStats } from '@/features/admin/api';
import { fetchMe } from '@/features/auth/api';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';

function StatCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-brand">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 font-display text-2xl font-medium tracking-tight text-brand-navy">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
        </div>
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-brand-hero-blue">
          <Icon className="size-5" strokeWidth={2} aria-hidden />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const cachedUser = useAuthStore((s) => s.user);
  const { data: me, isLoading: meLoading, isError: meError } = useQuery({ queryKey: ['me'], queryFn: fetchMe });
  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: fetchPlatformStats,
  });

  const user = me ?? cachedUser;
  const roleLabel =
    user?.adminRole === 'SUPER_ADMIN' ? 'Super admin' : user?.adminRole === 'ADMIN' ? 'Admin' : 'Administrator';

  const fmt = (n: number | undefined) => (typeof n === 'number' ? String(n) : '—');

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-normal tracking-tight text-brand-navy md:text-[2rem]">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            {meLoading && !user ? 'Loading your profile…' : null}
            {meError ? 'Could not refresh your profile. You can still use the console if your session is valid.' : null}
            {!meLoading || user ? (
              <>
                Signed in as <span className="font-medium text-foreground">{user?.email}</span>
                {user ? (
                  <>
                    {' '}
                    · <span className="text-foreground">{roleLabel}</span>
                  </>
                ) : null}
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-[9px]">
            <Link to={ROUTES.practitioners}>Review practitioners</Link>
          </Button>
          {user?.adminRole === 'SUPER_ADMIN' ? (
            <Button asChild className="rounded-[9px] bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-[0_4px_12px_rgba(20,184,166,0.25)]">
              <Link to={ROUTES.team}>Invite admin</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Patients"
          value={statsLoading ? '…' : fmt(stats?.patients)}
          hint="Registered patient accounts."
          icon={Users}
        />
        <StatCard
          title="Practitioners"
          value={statsLoading ? '…' : fmt(stats?.practitioners)}
          hint="Includes pending verification — manage in Practitioners."
          icon={UsersRound}
        />
        <StatCard
          title="Appointments"
          value={statsLoading ? '…' : fmt(stats?.appointments)}
          hint="All appointment records on the platform."
          icon={CalendarDays}
        />
        <StatCard
          title="Admin users"
          value={statsLoading ? '…' : fmt(stats?.admins)}
          hint="Console operators (super + standard)."
          icon={ShieldCheck}
        />
      </div>

      {statsError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Platform statistics could not be loaded. Check your connection and permissions, then refresh the page.
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-brand">
        <p className="font-display text-lg font-medium text-brand-navy">Next steps</p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Use <strong className="font-medium text-foreground">Practitioners</strong> to verify credentials, reject
          incomplete applications, or suspend accounts. Patient directory and audit trail are available from the
          sidebar.
        </p>
      </div>
    </div>
  );
}
