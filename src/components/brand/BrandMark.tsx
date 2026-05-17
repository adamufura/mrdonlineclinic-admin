import brandIcon from '@brand/icon.png';
import brandIconTransparent from '@brand/icon-transparent.png';
import { cn } from '@/lib/utils/cn';

export type BrandMarkSize = 'sm' | 'md' | 'lg';
export type BrandMarkVariant = 'default' | 'transparent';

const sizeClass: Record<BrandMarkSize, string> = {
  sm: 'size-8 rounded-[9px]',
  md: 'size-9 rounded-[11px] sm:size-10',
  lg: 'size-11 rounded-xl',
};

const pixelSize: Record<BrandMarkSize, number> = {
  sm: 32,
  md: 40,
  lg: 44,
};

type BrandMarkProps = {
  size?: BrandMarkSize;
  variant?: BrandMarkVariant;
  className?: string;
};

export function BrandMark({ size = 'sm', variant = 'default', className }: BrandMarkProps) {
  const src = variant === 'transparent' ? brandIconTransparent : brandIcon;
  const px = pixelSize[size];

  return (
    <img
      src={src}
      alt=""
      width={px}
      height={px}
      className={cn('shrink-0 object-contain', sizeClass[size], className)}
      aria-hidden
    />
  );
}
