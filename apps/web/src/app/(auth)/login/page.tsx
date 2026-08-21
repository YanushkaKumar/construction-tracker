'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, ArrowRight, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { createClient } from '@/utils/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  email:    z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router  = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError]       = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      // Try to authenticate with Supabase Auth (for frontend supabase features, if they have an account)
      // We ignore the error object because team members only exist in our local DB, not Supabase
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      // Authenticate with NestJS backend to get backend session
      const backendRes = await apiClient.post('/auth/login', {
        email: data.email,
        password: data.password,
      });
      
      const { user, company, accessToken, refreshToken } = backendRes.data;

      setAuth(user, company, accessToken, refreshToken);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message ?? 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showDemo = process.env.NEXT_PUBLIC_ENABLE_DEMO === 'true';

  const fillDemo = (email: string) => {
    setValue('email', email);
    setValue('password', 'BuildTrack@2026');
  };

  return (
    <div className="space-y-7 stagger-children">
      {/* Heading */}
      <div className="space-y-1.5 text-left">
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground/95 leading-tight">
          Welcome back
        </h1>
        <p className="text-[13px] text-muted-foreground/65 font-medium">
          Sign in to continue to BuildTrack.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-start gap-3 p-3.5 bg-danger-subtle border border-danger/25 rounded-xl" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4 text-danger flex-shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="text-[13px] font-semibold text-danger">Couldn&apos;t sign you in</p>
            <p className="text-[12px] text-danger/80 font-medium mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left" noValidate>
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="login-email" className="text-[12px] font-semibold text-foreground/80">
            Email address
          </Label>
          <Input
            id="login-email"
            type="email"
            placeholder="name@company.com"
            disabled={isLoading}
            autoComplete="email"
            {...register('email')}
            className="h-10 rounded-xl border-border/40 bg-accent/20 text-[13px] transition-all"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'login-email-err' : undefined}
          />
          {errors.email && (
            <p id="login-email-err" className="text-[11px] font-semibold text-danger" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password" className="text-[12px] font-semibold text-foreground/80">
              Password
            </Label>
            <Link href="/forgot-password" className="text-[11px] font-bold text-muted-foreground/65 hover:text-foreground transition-colors">
              Forgot password?
            </Link>
          </div>
          <Input
            id="login-password"
            type="password"
            placeholder="••••••••"
            disabled={isLoading}
            autoComplete="current-password"
            {...register('password')}
            className="h-10 rounded-xl border-border/40 bg-accent/20 text-[13px] transition-all"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'login-pw-err' : undefined}
          />
          {errors.password && (
            <p id="login-pw-err" className="text-[11px] font-semibold text-danger" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
          className="w-full flex items-center justify-center gap-2.5 h-10 bg-foreground text-background text-[13.5px] font-bold rounded-xl hover:brightness-110 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-surface mt-1"
        >
          {isLoading ? (
            <>
              <User className="h-4 w-4 animate-pulse" aria-hidden />
              Signing in…
            </>
          ) : (
            <>
              Sign in to workspace
              <ArrowRight className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
      </form>

      {/* Demo access — only rendered when explicitly enabled (NEXT_PUBLIC_ENABLE_DEMO=true) */}
      {showDemo && (
        <>
          <div className="relative flex items-center justify-center">
            <span className="absolute inset-x-0 border-t border-border/20" />
            <span className="relative bg-card px-4 text-[11px] font-medium text-muted-foreground/60">
              or try a demo account
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {[
              { label: 'Company Owner',   email: 'owner@lankabuild.lk',    dot: 'bg-success', role: 'Full access'   },
              { label: 'Project Manager', email: 'pm@lankabuild.lk',       dot: 'bg-info',    role: 'Operations'    },
              { label: 'Site Engineer',   email: 'engineer@lankabuild.lk', dot: 'bg-warning', role: 'Field access'  },
            ].map(demo => (
              <button
                key={demo.email}
                type="button"
                onClick={() => fillDemo(demo.email)}
                className="flex items-center gap-3 px-3.5 py-2.5 border border-border/25 bg-accent/20 hover:bg-accent/40 hover:border-border/40 rounded-xl text-left transition-all duration-200 group"
                aria-label={`Use ${demo.label} demo account`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${demo.dot}`} aria-hidden />
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-foreground">{demo.label}</p>
                  <p className="text-[11px] text-muted-foreground/55 mt-0.5">{demo.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] font-medium text-muted-foreground/50 hidden sm:block">{demo.role}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 group-hover:translate-x-0.5 transition-all" aria-hidden />
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <p className="text-center text-[12px] text-muted-foreground/50 font-medium">
        Need an account?{' '}
        <Link href="/register" className="font-semibold text-amber-600 hover:text-amber-500 hover:underline">
          Register your company
        </Link>
      </p>
    </div>
  );
}
