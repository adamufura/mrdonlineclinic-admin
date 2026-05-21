import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="font-display text-4xl font-medium text-brand-navy">{t('admin.notFound.title')}</p>
      <p className="max-w-md text-muted-foreground">{t('admin.notFound.message')}</p>
      <Button asChild variant="default">
        <Link to="/dashboard">{t('admin.notFound.back')}</Link>
      </Button>
    </div>
  );
}
