import { BrandMark } from '@/components/brand/BrandMark';
import { MinistryLogo } from '@/components/brand/MinistryLogo';
import { MINISTRY_STATE } from '@/config/ministry';
import { cn } from '@/lib/utils/cn';

type DualBrandMarkProps = {
  variant?: 'sidebar' | 'header' | 'compact';
  className?: string;
};

export function DualBrandMark({ variant = 'sidebar', className }: DualBrandMarkProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <MinistryLogo size="sm" />
        <span className="text-white/30" aria-hidden>
          |
        </span>
        <BrandMark size="sm" variant="transparent" />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <MinistryLogo size={variant === 'header' ? 'md' : 'lg'} showLabel />
      <div className="flex items-center gap-2 border-t border-white/10 pt-3">
        <BrandMark size="sm" variant="transparent" />
        <div className="min-w-0">
          <p className="font-display text-[12px] font-medium text-white/90">MRD Online Clinic</p>
          <p className="text-[10px] text-white/50">Telemedicine platform · {MINISTRY_STATE}</p>
        </div>
      </div>
    </div>
  );
}
