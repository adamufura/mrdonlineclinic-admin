const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#0ea5e9',
  IN_PROGRESS: '#8b5cf6',
  COMPLETED: '#14b8a6',
  CANCELLED: '#94a3b8',
  REJECTED: '#f43f5e',
  NO_SHOW: '#64748b',
};

function colorFor(label: string, i: number): string {
  return STATUS_COLORS[label] ?? ['#0ea5e9', '#14b8a6', '#8b5cf6', '#f59e0b'][i % 4];
}

export function DonutChart({
  data,
  size = 140,
  stroke = 22,
}: {
  data: { label: string; value: number }[];
  size?: number;
  stroke?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * r;

  if (total === 0) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        </svg>
        <span className="absolute text-xs text-muted-foreground">No data</span>
      </div>
    );
  }

  let offset = 0;
  const slices = data.map((d, i) => {
    const pct = d.value / total;
    const len = pct * c;
    const dash = `${len} ${c - len}`;
    const rot = (offset / c) * 360 - 90;
    offset += len;
    return (
      <circle
        key={d.label}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={colorFor(d.label, i)}
        strokeWidth={stroke}
        strokeDasharray={dash}
        transform={`rotate(${rot} ${cx} ${cy})`}
        strokeLinecap="butt"
      />
    );
  });

  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {slices}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-2xl font-medium text-brand-navy">{total}</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</span>
      </div>
    </div>
  );
}

export function DonutLegend({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <ul className="space-y-2">
      {data.map((d, i) => (
        <li key={d.label} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: colorFor(d.label, i) }}
            />
            <span className="text-muted-foreground">{d.label.replace(/_/g, ' ')}</span>
          </span>
          <span className="tabular-nums font-medium text-foreground">
            {d.value}{' '}
            <span className="text-xs font-normal text-muted-foreground">
              ({Math.round((d.value / total) * 100)}%)
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
