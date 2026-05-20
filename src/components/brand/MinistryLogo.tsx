import ministryLogo from '@brand/ministry-logo.jpeg';
import { MINISTRY_FULL_NAME } from '@/config/ministry';
import { cn } from '@/lib/utils/cn';

export type MinistryLogoSize = 'sm' | 'md' | 'lg';

const sizeClass: Record<MinistryLogoSize, string> = {
  sm: 'size-8',
  md: 'size-10 sm:size-11',
  lg: 'size-12 sm:size-14',
};

type MinistryLogoProps = {
  size?: MinistryLogoSize;
  className?: string;
  showLabel?: boolean;
};

export function MinistryLogo({ size = 'md', className, showLabel = false }: MinistryLogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img
        src={ministryLogo}
        alt={MINISTRY_FULL_NAME}
        className={cn('shrink-0 rounded-full object-contain ring-1 ring-white/20', sizeClass[size])}
      />
      {showLabel ? (
        <div className="min-w-0 leading-tight">
          <p className="font-display text-[13px] font-medium text-white sm:text-sm">{MINISTRY_FULL_NAME}</p>
          <p className="text-[10px] text-white/60 sm:text-[11px]">Government of Katsina State</p>
        </div>
      ) : null}
    </div>
  );
}
