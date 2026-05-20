import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Stethoscope,
  UserPlus,
  Users,
  UsersRound,
} from 'lucide-react';
import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { DashboardIllustration } from '@/components/admin/dashboard-illustration';
import { DonutChart, DonutLegend } from '@/components/admin/donut-chart';
import { Button } from '@/components/ui/button';
import { MINISTRY_FULL_NAME } from '@/config/ministry';
import { fetchPlatformStats, type AuditLogRow } from '@/features/admin/api';
import { fetchMe } from '@/features/auth/api';
import { usePermissions } from '@/hooks/usePermissions';
import { ADMIN_ROLE_LABELS, canManageStaff } from '@/lib/rbac';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';

const card =
  'rounded-2xl border border-[#e8edf4] bg-white shadow-sm transition-[box-shadow,transform] duration-200';

function greetingLabel(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayLabel(): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date());
}

function StatCard({
  tint,
  label,
  value,
  meta,
  icon: Icon,
  href,
}: {
  tint: 'sky' | 'teal' | 'indigo' | 'violet';
  label: string;
  value: string;
  meta: string;
  icon: typeof Users;
  href?: string;
}) {
  const blob =
    tint === 'sky'
      ? 'before:bg-sky-500/10'
      : tint === 'teal'
        ? 'before:bg-teal-500/10'
        : tint === 'indigo'
          ? 'before:bg-indigo-500/10'
          : 'before:bg-violet-500/10';

  const iconBg =
    tint === 'sky'
      ? 'bg-sky-500/10 text-sky-700'
      : tint === 'teal'
        ? 'bg-teal-500/10 text-teal-700'
        : tint === 'indigo'
          ? 'bg-indigo-500/10 text-indigo-700'
          : 'bg-violet-500/10 text-violet-700';

  const inner = (
    <div
      className={cn(
        card,
        'relative overflow-hidden p-5 before:absolute before:right-0 before:top-0 before:h-20 before:w-20 before:rounded-full',
        blob,
        href && 'hover:-translate-y-0.5 hover:shadow-md',
      )}
    >
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
          <p className="mt-1.5 font-display text-[2rem] font-medium leading-none tracking-tight text-brand-navy">
            {value}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{meta}</p>
        </div>
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', iconBg)}>
          <Icon className="size-[18px]" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
  return href ? <Link to={href}>{inner}</Link> : inner;
}

function Panel({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn(card, 'p-5', className)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-medium text-brand-navy">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function auditActor(log: AuditLogRow) {
  const a = log.actor;
  if (a && typeof a === 'object') {
    const n = [a.firstName, a.lastName].filter(Boolean).join(' ');
    return n || a.email || 'System';
  }
  return '—';
}

function PlatformBar({
  patients,
  practitioners,
  appointments,
}: {
  patients: number;
  practitioners: number;
  appointments: number;
}) {
  const total = patients + practitioners + appointments || 1;
  const segments = [
    { label: 'Patients', value: patients, color: 'bg-sky-500' },
    { label: 'Practitioners', value: practitioners, color: 'bg-teal-500' },
    { label: 'Appointments', value: appointments, color: 'bg-indigo-400' },
  ];
  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full bg-[#eef2f8]">
        {segments.map((s) =>
          s.value > 0 ? (
            <div
              key={s.label}
              className={cn(s.color, 'transition-all')}
              style={{ width: `${(s.value / total) * 100}%` }}
              title={`${s.label}: ${s.value}`}
            />
          ) : null,
        )}
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className={cn('size-2 rounded-full', s.color)} />
            {s.label} <span className="font-medium text-foreground">{s.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const cachedUser = useAuthStore((s) => s.user);
  const { can } = usePermissions();
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: fetchMe });
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: fetchPlatformStats,
    enabled: can('stats:read'),
  });

  const user = me ?? cachedUser;
  const roleLabel =
    user?.adminRole && ADMIN_ROLE_LABELS[user.adminRole as keyof typeof ADMIN_ROLE_LABELS]
      ? ADMIN_ROLE_LABELS[user.adminRole as keyof typeof ADMIN_ROLE_LABELS]
      : 'Ministry staff';

  const fmt = (n?: number) => (typeof n === 'number' ? n.toLocaleString() : '—');
  const apptEntries = Object.entries(stats?.appointmentsByStatus ?? {}).map(([label, value]) => ({
    label,
    value,
  }));

  return (
    <div className="space-y-6">
      {/* Hero — light, no heavy shadow */}
      <div className={cn(card, 'overflow-hidden p-0')}>
        <div className="grid lg:grid-cols-[1fr_minmax(200px,280px)]">
          <div className="p-6 md:p-8">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-500/15 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-800">
              <span className="size-1.5 animate-pulse rounded-full bg-sky-500" />
              {todayLabel()}
            </p>
            <h1 className="font-display text-[clamp(1.75rem,4vw,2.25rem)] font-normal leading-tight tracking-tight text-brand-navy">
              {greetingLabel()},{' '}
              <em className="font-medium not-italic text-sky-800">{user?.firstName ?? 'there'}</em>
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              {MINISTRY_FULL_NAME} oversight — {roleLabel.toLowerCase()}. Monitor telemedicine operations
              across Katsina State.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">{user?.email}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {can('practitioners:read') ? (
                <Button asChild size="sm" className="rounded-lg bg-gradient-to-r from-teal-600 to-sky-600 text-white shadow-sm">
                  <Link to={ROUTES.practitioners}>
                    Practitioners
                    <ArrowRight className="ml-1 size-3.5" />
                  </Link>
                </Button>
              ) : null}
              {canManageStaff(user?.adminRole) ? (
                <Button asChild size="sm" variant="outline" className="rounded-lg">
                  <Link to={ROUTES.team}>Ministry staff</Link>
                </Button>
              ) : null}
            </div>
          </div>
          <div className="hidden items-center justify-center border-l border-[#e8edf4] bg-gradient-to-br from-sky-50/80 to-teal-50/50 px-4 lg:flex">
            <DashboardIllustration className="h-auto w-full max-w-[260px]" />
          </div>
        </div>
      </div>

      {can('stats:read') ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              tint="sky"
              label="Patients"
              value={isLoading ? '…' : fmt(stats?.patients)}
              meta={`${fmt(stats?.activePatients)} active on platform`}
              icon={Users}
              href={can('patients:read') ? ROUTES.patients : undefined}
            />
            <StatCard
              tint="teal"
              label="Practitioners"
              value={isLoading ? '…' : fmt(stats?.practitioners)}
              meta={`${fmt(stats?.activePractitioners)} verified & bookable`}
              icon={Stethoscope}
              href={can('practitioners:read') ? ROUTES.practitioners : undefined}
            />
            <StatCard
              tint="indigo"
              label="Appointments"
              value={isLoading ? '…' : fmt(stats?.appointments)}
              meta={`${fmt(stats?.pendingAppointments)} pending · ${fmt(stats?.completedAppointments)} done`}
              icon={CalendarDays}
            />
            <StatCard
              tint="violet"
              label="Ministry staff"
              value={isLoading ? '…' : fmt(stats?.admins)}
              meta="Console operators"
              icon={UsersRound}
              href={can('admins:read') ? ROUTES.team : undefined}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            {/* Attention */}
            <Panel
              title="Needs attention"
              className="lg:col-span-4"
              action={
                can('practitioners:read') ? (
                  <Link to={ROUTES.practitioners} className="text-xs font-medium text-amber-800 hover:underline">
                    Review
                  </Link>
                ) : null
              }
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-amber-50/90 px-4 py-3 ring-1 ring-amber-200/60">
                  <span className="text-sm text-amber-950/90">Pending verification</span>
                  <span className="font-display text-xl font-medium text-amber-950">
                    {isLoading ? '…' : fmt(stats?.pendingVerification)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-sky-50/90 px-4 py-3 ring-1 ring-sky-200/50">
                  <span className="text-sm text-sky-950/90">Pending appointments</span>
                  <span className="font-display text-xl font-medium text-sky-950">
                    {isLoading ? '…' : fmt(stats?.pendingAppointments)}
                  </span>
                </div>
              </div>
            </Panel>

            {/* Donut chart */}
            <Panel title="Appointments by status" className="lg:col-span-5">
              {apptEntries.length === 0 && !isLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No appointment data yet.</p>
              ) : (
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-center">
                  <DonutChart data={apptEntries} size={148} stroke={24} />
                  <DonutLegend data={apptEntries} />
                </div>
              )}
            </Panel>

            {/* Platform overview */}
            <Panel title="Platform mix" className="lg:col-span-3">
              <PlatformBar
                patients={stats?.patients ?? 0}
                practitioners={stats?.practitioners ?? 0}
                appointments={stats?.appointments ?? 0}
              />
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Relative volume of registered patients, practitioners, and appointment records.
              </p>
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Quick actions">
              <div className="grid gap-2 sm:grid-cols-2">
                {can('practitioners:onboard') ? (
                  <Link
                    to={ROUTES.practitioners}
                    className="flex items-center gap-3 rounded-xl border border-[#e8edf4] bg-[#fafbfd] px-4 py-3 text-sm font-medium text-foreground transition hover:border-teal-200 hover:bg-teal-50/50"
                  >
                    <span className="flex size-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-700">
                      <Stethoscope className="size-4" />
                    </span>
                    Onboard practitioner
                  </Link>
                ) : null}
                {can('patients:write') ? (
                  <Link
                    to={ROUTES.patients}
                    className="flex items-center gap-3 rounded-xl border border-[#e8edf4] bg-[#fafbfd] px-4 py-3 text-sm font-medium text-foreground transition hover:border-sky-200 hover:bg-sky-50/50"
                  >
                    <span className="flex size-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-700">
                      <UserPlus className="size-4" />
                    </span>
                    Onboard patient
                  </Link>
                ) : null}
                {canManageStaff(user?.adminRole) ? (
                  <Link
                    to={ROUTES.team}
                    className="flex items-center gap-3 rounded-xl border border-[#e8edf4] bg-[#fafbfd] px-4 py-3 text-sm font-medium text-foreground transition hover:border-violet-200 hover:bg-violet-50/50"
                  >
                    <span className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-700">
                      <UsersRound className="size-4" />
                    </span>
                    Manage staff
                  </Link>
                ) : null}
                {can('audit:read') ? (
                  <Link
                    to={ROUTES.audit}
                    className="flex items-center gap-3 rounded-xl border border-[#e8edf4] bg-[#fafbfd] px-4 py-3 text-sm font-medium text-foreground transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span className="flex size-9 items-center justify-center rounded-lg bg-slate-500/10 text-slate-700">
                      <Clock className="size-4" />
                    </span>
                    Audit log
                  </Link>
                ) : null}
              </div>
            </Panel>

            <Panel
              title="Recent activity"
              action={
                can('audit:read') ? (
                  <Link to={ROUTES.audit} className="text-xs font-medium text-sky-700 hover:underline">
                    View all
                  </Link>
                ) : null
              }
            >
              <ul className="max-h-[220px] space-y-0 overflow-y-auto">
                {(stats?.recentAudit?.length ?? 0) === 0 ? (
                  <li className="py-6 text-center text-sm text-muted-foreground">No recent actions.</li>
                ) : (
                  stats!.recentAudit!.slice(0, 8).map((log) => (
                    <li
                      key={log._id}
                      className="flex gap-3 border-b border-[#f1f5f9] py-3 last:border-0"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-teal-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium capitalize text-foreground">
                          {log.action.replace(/_/g, ' ').toLowerCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {auditActor(log)}
                          {log.createdAt ? ` · ${new Date(log.createdAt).toLocaleString()}` : ''}
                        </p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </Panel>
          </div>
        </>
      ) : (
        <div className={cn(card, 'p-6 text-sm text-muted-foreground')}>
          Your role does not include platform statistics. Use the sidebar for permitted sections.
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Tip: press <kbd className="rounded border border-[#e2e8f0] bg-white px-1.5 py-0.5 font-mono">⌘K</kbd> to
        search any record
      </p>
    </div>
  );
}
