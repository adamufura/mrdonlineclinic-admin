import { BrandMark } from '@/components/brand/BrandMark';

export function AppSplash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background text-muted-foreground">
      <BrandMark size="lg" />
      <p className="text-sm">Loading…</p>
    </div>
  );
}
