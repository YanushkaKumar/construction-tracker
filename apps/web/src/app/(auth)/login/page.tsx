'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, AlertCircle, ArrowRight, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/auth/login', data);
      const { user, company, accessToken, refreshToken } = response.data;
      
      // Store in Zustand store (include refreshToken for silent refresh)
      setAuth(user, company, accessToken, refreshToken);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Invalid email or password. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (email: string) => {
    setValue('email', email);
    setValue('password', 'BuildTrack@2026');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Welcome back
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Enter your email and password to access your account
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@company.com"
            disabled={isLoading}
            {...register('email')}
            className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {errors.email && (
            <p className="text-xs font-medium text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-amber-600 hover:text-amber-500 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            disabled={isLoading}
            {...register('password')}
            className={errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {errors.password && (
            <p className="text-xs font-medium text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full bg-amber-500 text-zinc-950 hover:bg-amber-600 font-semibold" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            <>
              Log in
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="relative flex justify-center text-xs uppercase my-6">
        <span className="absolute inset-x-0 top-1/2 -z-10 border-t border-zinc-200 dark:border-zinc-800" />
        <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-500 dark:text-zinc-400">
          Demo Logins (Auto-Fill)
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => fillDemoCredentials('owner@lankabuild.lk')}
          className="justify-start text-xs border-zinc-200 hover:border-amber-500 dark:border-zinc-800 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
        >
          <User className="mr-2 h-3.5 w-3.5 text-amber-500" />
          <span>Owner: <strong className="text-zinc-700 dark:text-zinc-300">owner@lankabuild.lk</strong></span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => fillDemoCredentials('pm@lankabuild.lk')}
          className="justify-start text-xs border-zinc-200 hover:border-amber-500 dark:border-zinc-800 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
        >
          <User className="mr-2 h-3.5 w-3.5 text-amber-500" />
          <span>Manager: <strong className="text-zinc-700 dark:text-zinc-300">pm@lankabuild.lk</strong></span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => fillDemoCredentials('engineer@lankabuild.lk')}
          className="justify-start text-xs border-zinc-200 hover:border-amber-500 dark:border-zinc-800 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
        >
          <User className="mr-2 h-3.5 w-3.5 text-amber-500" />
          <span>Engineer: <strong className="text-zinc-700 dark:text-zinc-300">engineer@lankabuild.lk</strong></span>
        </Button>
      </div>

      <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-semibold text-amber-600 hover:text-amber-500 hover:underline"
        >
          Register Company
        </Link>
      </div>
    </div>
  );
}
