import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { AuthEyebrow } from '@/components/auth/AuthEyebrow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { MINISTRY_FULL_NAME } from '@/config/ministry';
import { adminLogin } from '@/features/auth/api';
import { normalizeAxiosError } from '@/lib/api/errors';
import { useAuthStore } from '@/stores/auth-store';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const mutation = useMutation({
    mutationFn: adminLogin,
    onSuccess: (data) => {
      if (data.user.role !== 'ADMIN') {
        toast.error('This account is not a ministry staff user.');
        return;
      }
      setSession(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      toast.success('Welcome');
      void navigate('/dashboard', { replace: true });
    },
    onError: (e) => {
      toast.error(normalizeAxiosError(e).message);
    },
  });

  return (
    <div className="space-y-1">
      <AuthEyebrow>Ministry staff console</AuthEyebrow>
      <h1 className="font-display text-[clamp(2rem,4.5vw,2.75rem)] font-normal leading-[1.06] tracking-[-0.02em] text-brand-navy">
        Sign in to <em className="text-brand-hero-blue not-italic">MoH Katsina.</em>
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-brand-body">
        Use the credentials issued by {MINISTRY_FULL_NAME} for this oversight console.
      </p>

      <form className="mt-8 space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[12px] font-medium text-slate-700">
            Email address
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@health.katsina.gov.ng"
              className="rounded-xl border-slate-200 pl-12 focus-visible:border-sky-500 focus-visible:ring-sky-500/20"
              {...form.register('email')}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[12px] font-medium text-slate-700">
            Password
          </Label>
          <PasswordInput
            id="password"
            leftIcon={<Lock strokeWidth={2} />}
            autoComplete="current-password"
            placeholder="••••••••"
            className="rounded-xl border-slate-200 focus-visible:border-sky-500 focus-visible:ring-sky-500/20"
            {...form.register('password')}
          />
        </div>

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-sky-500 to-sky-800 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(14,165,233,0.28)] transition hover:brightness-[1.03] disabled:opacity-60"
        >
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
          {!mutation.isPending ? <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden /> : null}
        </Button>
      </form>
    </div>
  );
}
