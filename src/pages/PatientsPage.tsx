import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { listPatientsAdmin } from '@/features/admin/api';
import { normalizeAxiosError } from '@/lib/api/errors';

export default function PatientsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const limit = 20;

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const query = useQuery({
    queryKey: ['admin', 'patients', page, limit, debouncedSearch],
    queryFn: () =>
      listPatientsAdmin({
        page,
        limit,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      }),
  });

  const items = query.data?.items ?? [];
  const meta = query.data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight text-brand-navy md:text-[2rem]">Patients</h1>
        <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
          Search the patient directory by name, email, or phone. This view is read-only for MVP oversight.
        </p>
      </div>

      <div className="max-w-md">
        <Label htmlFor="patient-search" className="text-muted-foreground">
          Search
        </Label>
        <Input
          id="patient-search"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setPage(1);
          }}
          placeholder="Email, phone, or name…"
          className="mt-1.5"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-brand">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    Loading patients…
                  </td>
                </tr>
              ) : query.isError ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-red-600">
                    {normalizeAxiosError(query.error).message}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    No patients match your search.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={String(row._id)} className="bg-card hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {[row.firstName, row.lastName].filter(Boolean).join(' ')}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.phoneNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground">
          <span>
            Page {meta?.page ?? page} of {totalPages}
            {typeof meta?.total === 'number' ? ` · ${meta.total} total` : null}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
