import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FilterOption = { value: string; label: string };

type ListToolbarProps = {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  filters?: {
    id: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (v: string) => void;
  }[];
};

export function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search by name, email, or phone…',
  filters = [],
}: ListToolbarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#e8edf4] bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-[200px] flex-1">
        <Label htmlFor="list-search" className="text-muted-foreground">
          Search
        </Label>
        <div className="relative mt-1.5">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="list-search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>
      </div>
      {filters.map((f) => (
        <div key={f.id} className="min-w-[160px]">
          <Label htmlFor={f.id} className="text-muted-foreground">
            {f.label}
          </Label>
          <select
            id={f.id}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="mt-1.5 flex h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
          >
            {f.options.map((o) => (
              <option key={o.value || '__all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
