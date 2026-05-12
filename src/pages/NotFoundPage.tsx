import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="font-display text-4xl font-medium text-brand-navy">404</p>
      <p className="max-w-md text-muted-foreground">That page does not exist in the admin console.</p>
      <Button asChild variant="default">
        <Link to="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
