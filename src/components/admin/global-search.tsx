import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { globalSearchAdmin } from '@/features/admin/api';
import { usePermissions } from '@/hooks/usePermissions';
import { ROUTES } from '@/router/routes';

export function GlobalSearch({ inputRef }: { inputRef?: React.RefObject<HTMLInputElement | null> }) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const debouncedQ = q.trim();
  const { data, isFetching } = useQuery({
    queryKey: ['admin', 'search', debouncedQ],
    queryFn: () => globalSearchAdmin(debouncedQ),
    enabled: debouncedQ.length >= 2,
    staleTime: 30_000,
  });

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const hasResults =
    (data?.practitioners?.length ?? 0) + (data?.patients?.length ?? 0) + (data?.staff?.length ?? 0) > 0;

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1 max-lg:max-w-none lg:max-w-[460px]">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search practitioners, patients, staff…"
        className="h-9 border-[#e2e8f0] bg-[#eef1f6] pl-9 pr-14 text-[13px] shadow-none focus-visible:border-teal-500 focus-visible:bg-white focus-visible:ring-teal-500/20"
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-[#e2e8f0] bg-white px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
        ⌘K
      </kbd>

      {open && debouncedQ.length >= 2 ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[min(70vh,420px)] overflow-y-auto rounded-xl border border-border bg-white py-2 shadow-float">
          {isFetching ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Searching…</p>
          ) : !hasResults ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No matches for “{debouncedQ}”</p>
          ) : (
            <>
              {can('practitioners:read') && (data?.practitioners?.length ?? 0) > 0 ? (
                <div className="px-2 pb-1">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Practitioners
                  </p>
                  {data!.practitioners.map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      className="flex w-full flex-col rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/60"
                      onClick={() => {
                        navigate(ROUTES.practitionerDetail(String(p._id)));
                        setOpen(false);
                        setQ('');
                      }}
                    >
                      <span className="font-medium">
                        {p.firstName} {p.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">{p.email}</span>
                    </button>
                  ))}
                </div>
              ) : null}
              {can('patients:read') && (data?.patients?.length ?? 0) > 0 ? (
                <div className="px-2 pb-1">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Patients
                  </p>
                  {data!.patients.map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      className="flex w-full flex-col rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/60"
                      onClick={() => {
                        navigate(ROUTES.patientDetail(String(p._id)));
                        setOpen(false);
                        setQ('');
                      }}
                    >
                      <span className="font-medium">
                        {p.firstName} {p.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">{p.email}</span>
                    </button>
                  ))}
                </div>
              ) : null}
              {can('admins:read') && (data?.staff?.length ?? 0) > 0 ? (
                <div className="px-2">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Ministry staff
                  </p>
                  {data!.staff.map((s) => (
                    <button
                      key={s._id}
                      type="button"
                      className="flex w-full flex-col rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/60"
                      onClick={() => {
                        navigate(ROUTES.staffDetail(String(s._id)));
                        setOpen(false);
                        setQ('');
                      }}
                    >
                      <span className="font-medium">
                        {s.firstName} {s.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">{s.email}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
