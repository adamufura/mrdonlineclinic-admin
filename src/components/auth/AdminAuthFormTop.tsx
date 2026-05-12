import { ArrowLeft } from 'lucide-react';
import { getMainAppUrl } from '@/config/env';

export function AdminAuthFormTop() {
  const mainApp = getMainAppUrl();

  return (
    <div className="mb-2 flex items-center justify-between gap-4">
      {mainApp ? (
        <a
          href={mainApp}
          className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 transition-colors hover:text-brand-navy"
        >
          <ArrowLeft className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
          Back to clinic site
        </a>
      ) : (
        <span className="text-[13px] font-medium text-slate-400">MRD staff access</span>
      )}
    </div>
  );
}
