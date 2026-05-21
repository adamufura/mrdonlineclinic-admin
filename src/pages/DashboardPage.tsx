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
import { useTranslation } from 'react-i18next';
import { DashboardIllustration } from '@/components/admin/dashboard-illustration';
import { DonutChart, DonutLegend } from '@/components/admin/donut-chart';
import { Button } from '@/components/ui/button';
import { MINISTRY_FULL_NAME } from '@/config/ministry';
import { fetchPlatformStats, type AuditLogRow } from '@/features/admin/api';
import { fetchMe } from '@/features/auth/api';
import { usePermissions } from '@/hooks/usePermissions';
import { greetingKey, labelAdminRole, labelAppointmentStatus, labelAuditAction } from '@/lib/i18n/admin-labels';
import { canManageStaff } from '@/lib/rbac';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';

const card =
  'rounded-2xl border border-[#e8edf4] bg-white shadow-sm transition-[box-shadow,transform] duration-200';

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

function auditActor(log: AuditLogRow, systemLabel: string) {
  const a = log.actor;
  if (a && typeof a === 'object') {
    const n = [a.firstName, a.lastName].filter(Boolean).join(' ');
    return n || a.email || systemLabel;
  }
  return '—';
}

function PlatformBar({
  patients,
  practitioners,
  appointments,
  labels,
}: {
  patients: number;
  practitioners: number;
  appointments: number;
  labels: { patients: string; practitioners: string; appointments: string };
}) {
  const total = patients + practitioners + appointments || 1;
  const segments = [
    { label: labels.patients, value: patients, color: 'bg-sky-500' },
    { label: labels.practitioners, value: practitioners, color: 'bg-teal-500' },
    { label: labels.appointments, value: appointments, color: 'bg-indigo-400' },
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
  const { t } = useTranslation();
  const cachedUser = useAuthStore((s) => s.user);
  const { can } = usePermissions();
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: fetchMe });
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: fetchPlatformStats,
    enabled: can('stats:read'),
  });

  const user = me ?? cachedUser;
  const roleLabel = user?.adminRole
    ? labelAdminRole(user.adminRole)
    : t('admin.dashboard.ministryStaffFallback');

  const fmt = (n?: number) => (typeof n === 'number' ? n.toLocaleString() : '—');
  const apptEntries = Object.entries(stats?.appointmentsByStatus ?? {}).map(([status, value]) => ({
    status,
    label: labelAppointmentStatus(status),
    value,
  }));

  const greetingKeys = {
    morning: 'admin.dashboard.greetingMorning',
    afternoon: 'admin.dashboard.greetingAfternoon',
    evening: 'admin.dashboard.greetingEvening',
  } as const;
  const greeting = t(greetingKeys[greetingKey()]);

  return (
    <div className="space-y-6">
      <div className={cn(card, 'overflow-hidden p-0')}>
        <div className="grid lg:grid-cols-[1fr_minmax(200px,280px)]">
          <div className="p-6 md:p-8">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-500/15 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-800">
              <span className="size-1.5 animate-pulse rounded-full bg-sky-500" />
              {todayLabel()}
            </p>
            <h1 className="font-display text-[clamp(1.75rem,4vw,2.25rem)] font-normal leading-tight tracking-tight text-brand-navy">
              {greeting},{' '}
              <em className="font-medium not-italic text-sky-800">{user?.firstName ?? t('admin.dashboard.there')}</em>
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              {t('admin.dashboard.roleSubtitle', { ministry: MINISTRY_FULL_NAME, role: roleLabel })}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">{user?.email}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {can('practitioners:read') ? (
                <Button asChild size="sm" className="rounded-lg bg-gradient-to-r from-teal-600 to-sky-600 text-white shadow-sm">
                  <Link to={ROUTES.practitioners}>
                    {t('nav.practitioners')}
                    <ArrowRight className="ml-1 size-3.5" />
                  </Link>
                </Button>
              ) : null}
              {canManageStaff(user?.adminRole) ? (
                <Button asChild size="sm" variant="outline" className="rounded-lg">
                  <Link to={ROUTES.team}>{t('nav.team')}</Link>
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
              label={t('admin.dashboard.stats.patients')}
              value={isLoading ? '…' : fmt(stats?.patients)}
              meta={t('admin.dashboard.stats.activePatientsMeta', { count: fmt(stats?.activePatients) })}
              icon={Users}
              href={can('patients:read') ? ROUTES.patients : undefined}
            />
            <StatCard
              tint="teal"
              label={t('admin.dashboard.stats.practitioners')}
              value={isLoading ? '…' : fmt(stats?.practitioners)}
              meta={t('admin.dashboard.stats.verifiedBookableMeta', { count: fmt(stats?.activePractitioners) })}
              icon={Stethoscope}
              href={can('practitioners:read') ? ROUTES.practitioners : undefined}
            />
            <StatCard
              tint="indigo"
              label={t('admin.dashboard.stats.appointments')}
              value={isLoading ? '…' : fmt(stats?.appointments)}
              meta={t('admin.dashboard.stats.appointmentsMeta', {
                pending: fmt(stats?.pendingAppointments),
                done: fmt(stats?.completedAppointments),
              })}
              icon={CalendarDays}
            />
            <StatCard
              tint="violet"
              label={t('admin.dashboard.stats.staff')}
              value={isLoading ? '…' : fmt(stats?.admins)}
              meta={t('admin.dashboard.stats.consoleOperators')}
              icon={UsersRound}
              href={can('admins:read') ? ROUTES.team : undefined}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <Panel
              title={t('admin.dashboard.needsAttention')}
              className="lg:col-span-4"
              action={
                can('practitioners:read') ? (
                  <Link to={ROUTES.practitioners} className="text-xs font-medium text-amber-800 hover:underline">
                    {t('admin.dashboard.review')}
                  </Link>
                ) : null
              }
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-amber-50/90 px-4 py-3 ring-1 ring-amber-200/60">
                  <span className="text-sm text-amber-950/90">{t('admin.dashboard.pendingVerification')}</span>
                  <span className="font-display text-xl font-medium text-amber-950">
                    {isLoading ? '…' : fmt(stats?.pendingVerification)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-sky-50/90 px-4 py-3 ring-1 ring-sky-200/50">
                  <span className="text-sm text-sky-950/90">{t('admin.dashboard.pendingAppointments')}</span>
                  <span className="font-display text-xl font-medium text-sky-950">
                    {isLoading ? '…' : fmt(stats?.pendingAppointments)}
                  </span>
                </div>
              </div>
            </Panel>

            <Panel title={t('admin.dashboard.appointmentsByStatus')} className="lg:col-span-5">
              {apptEntries.length === 0 && !isLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{t('admin.dashboard.appointmentsEmpty')}</p>
              ) : (
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-center">
                  <DonutChart data={apptEntries} size={148} stroke={24} />
                  <DonutLegend data={apptEntries} />
                </div>
              )}
            </Panel>

            <Panel title={t('admin.dashboard.platformMix')} className="lg:col-span-3">
              <PlatformBar
                patients={stats?.patients ?? 0}
                practitioners={stats?.practitioners ?? 0}
                appointments={stats?.appointments ?? 0}
                labels={{
                  patients: t('admin.dashboard.platformPatients'),
                  practitioners: t('admin.dashboard.platformPractitioners'),
                  appointments: t('admin.dashboard.platformAppointments'),
                }}
              />
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t('admin.dashboard.platformMixHint')}</p>
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title={t('admin.dashboard.quickActions')}>
              <div className="grid gap-2 sm:grid-cols-2">
                {can('practitioners:onboard') ? (
                  <Link
                    to={ROUTES.practitioners}
                    className="flex items-center gap-3 rounded-xl border border-[#e8edf4] bg-[#fafbfd] px-4 py-3 text-sm font-medium text-foreground transition hover:border-teal-200 hover:bg-teal-50/50"
                  >
                    <span className="flex size-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-700">
                      <Stethoscope className="size-4" />
                    </span>
                    {t('admin.dashboard.onboardPractitioner')}
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
                    {t('admin.dashboard.onboardPatient')}
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
                    {t('admin.dashboard.manageStaff')}
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
                    {t('admin.dashboard.auditLog')}
                  </Link>
                ) : null}
              </div>
            </Panel>

            <Panel
              title={t('admin.dashboard.recentActivity')}
              action={
                can('audit:read') ? (
                  <Link to={ROUTES.audit} className="text-xs font-medium text-sky-700 hover:underline">
                    {t('admin.dashboard.viewAll')}
                  </Link>
                ) : null
              }
            >
              <ul className="max-h-[220px] space-y-0 overflow-y-auto">
                {(stats?.recentAudit?.length ?? 0) === 0 ? (
                  <li className="py-6 text-center text-sm text-muted-foreground">{t('admin.dashboard.noRecent')}</li>
                ) : (
                  stats!.recentAudit!.slice(0, 8).map((log) => (
                    <li
                      key={log._id}
                      className="flex gap-3 border-b border-[#f1f5f9] py-3 last:border-0"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-teal-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{labelAuditAction(log.action)}</p>
                        <p className="text-xs text-muted-foreground">
                          {auditActor(log, t('admin.audit.system'))}
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
        <div className={cn(card, 'p-6 text-sm text-muted-foreground')}>{t('admin.dashboard.noStatsAccess')}</div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {t('admin.dashboard.searchTip', {
          kbd: '⌘K',
        })}
      </p>
    </div>
  );
}
