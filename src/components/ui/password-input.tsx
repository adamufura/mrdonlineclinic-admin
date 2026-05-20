import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';
import { Input, type InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';

export type PasswordInputProps = InputProps & {
  leftIcon?: React.ReactNode;
};

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, leftIcon, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative w-full">
        {leftIcon ? (
          <div
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400 [&_svg]:size-[1.125rem]"
            aria-hidden
          >
            {leftIcon}
          </div>
        ) : null}
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn('pr-11', leftIcon && 'pl-12', className)}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
