import { cn } from '@/lib/utils/cn';

export type TabItem = { id: string; label: string; hint?: string };

export function DetailTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      className="flex gap-1 overflow-x-auto rounded-xl border border-[#e8edf4] bg-[#f8fafc] p-1"
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition',
              isActive
                ? 'bg-white text-brand-navy shadow-sm ring-1 ring-[#e8edf4]'
                : 'text-muted-foreground hover:bg-white/60 hover:text-foreground',
            )}
          >
            <span>{tab.label}</span>
            {tab.hint && isActive ? (
              <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">{tab.hint}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
