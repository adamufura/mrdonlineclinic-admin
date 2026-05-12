import type { ReactNode } from 'react';

export function AuthEyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/[0.08] px-3.5 py-1.5 text-[12px] font-semibold text-sky-900 shadow-sm">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-sky-400 opacity-40" />
        <span className="relative inline-flex size-1.5 rounded-full bg-sky-500" />
      </span>
      {children}
    </div>
  );
}
