import heroLoginSvg from '@/components/auth/illustrations/hero-login.svg?raw';

export function AdminAuthHero() {
  return (
    <div
      className="auth-hero-svg relative z-10 mx-auto flex w-full max-w-[min(100%,34rem)] flex-1 flex-col items-center justify-center px-1 py-2 md:py-4 [&>svg]:h-auto [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: heroLoginSvg.trim() }}
    />
  );
}
