import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updatePreferredLanguage } from '@/features/auth/api';
import { setAppLanguage } from '@/i18n';
import { cn } from '@/lib/utils/cn';
import type { AppLanguage } from '@/types/language';
import { useAuthStore } from '@/stores/auth-store';

type Props = { className?: string };

export function LanguageSwitcher({ className }: Props) {
  const { i18n, t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const current = (i18n.language === 'ha' ? 'ha' : 'en') as AppLanguage;
  const next: AppLanguage = current === 'en' ? 'ha' : 'en';
  const label = current === 'en' ? 'EN' : 'HA';

  const mutation = useMutation({
    mutationFn: updatePreferredLanguage,
    onSuccess: (updatedUser) => {
      if (accessToken && refreshToken) {
        setSession(updatedUser, accessToken, refreshToken);
      }
    },
    onError: () => toast.error('Could not save language preference'),
  });

  return (
    <button
      type="button"
      title={`${t('language.switch')}: ${current === 'en' ? t('language.hausa') : t('language.english')}`}
      onClick={() => {
        void (async () => {
          await setAppLanguage(next);
          if (user) mutation.mutate(next);
        })();
      }}
      disabled={mutation.isPending}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50',
        className,
      )}
    >
      <Globe className="size-3.5" aria-hidden />
      {label}
    </button>
  );
}
