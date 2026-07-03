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
    <div className="space-y-6 stagger-children">
      <div className="space-y-2 text-left">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Welcome back
        </h2>
        <p className="text-xs text-muted-foreground font-medium">
          Enter your credentials to access your BuildTrack command center.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-danger-subtle border-danger/30 text-danger-foreground rounded-xl">
          <AlertCircle className="h-4 w-4 text-danger" />
          <AlertTitle className="text-xs font-bold uppercase tracking-wider">Authentication Error</AlertTitle>
          <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-foreground/80">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@company.com"
            disabled={isLoading}
            {...register('email')}
            className={`bg-background/40 border-border/40 text-sm h-10 focus-visible:ring-foreground/20 rounded-xl ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          />
          {errors.email && (
            <p className="text-[10px] font-bold text-danger mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold text-foreground/80">Password</Label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors"
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
            className={`bg-background/40 border-border/40 text-sm h-10 focus-visible:ring-foreground/20 rounded-xl ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          />
          {errors.password && (
            <p className="text-[10px] font-bold text-danger mt-1">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90 font-semibold h-10 rounded-xl mt-2 transition-colors duration-250" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            <>
              Log in to Workspace
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="relative flex justify-center text-[10px] uppercase my-6 font-bold tracking-widest text-muted-foreground/50">
        <span className="absolute inset-x-0 top-1/2 -z-10 border-t border-border/20" />
        <span className="bg-card px-3.5">
          Quick Access Demo
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        <button
          type="button"
          onClick={() => fillDemoCredentials('owner@lankabuild.lk')}
          className="flex items-center justify-between text-xs border border-border/30 bg-accent/25 hover:bg-accent/40 rounded-xl p-3 text-left transition-all duration-200 group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-success shadow-sm" />
            <div>
              <div className="font-bold text-foreground">Property Owner</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">owner@lankabuild.lk</div>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          onClick={() => fillDemoCredentials('pm@lankabuild.lk')}
          className="flex items-center justify-between text-xs border border-border/30 bg-accent/25 hover:bg-accent/40 rounded-xl p-3 text-left transition-all duration-200 group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-info shadow-sm" />
            <div>
              <div className="font-bold text-foreground">Project Manager</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">pm@lankabuild.lk</div>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          onClick={() => fillDemoCredentials('engineer@lankabuild.lk')}
          className="flex items-center justify-between text-xs border border-border/30 bg-accent/25 hover:bg-accent/40 rounded-xl p-3 text-left transition-all duration-200 group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-warning shadow-sm" />
            <div>
              <div className="font-bold text-foreground">Site Engineer</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">engineer@lankabuild.lk</div>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="text-center text-xs text-muted-foreground font-semibold">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-bold text-foreground hover:underline ml-1"
        >
          Register Company
        </Link>
      </div>
    </div>
  );
}
