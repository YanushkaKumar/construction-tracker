'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const registerSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            company_name: data.companyName,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message || 'Supabase signup failed');
      }

      // 2. Create the company and user in the NestJS backend
      const registerRes = await apiClient.post('/auth/register', data);

      // 3. Log them in directly using the backend tokens!
      if (registerRes.data && registerRes.data.accessToken) {
        const { user, company, accessToken, refreshToken } = registerRes.data;
        
        setAuth(user, company, accessToken, refreshToken);
        router.push('/dashboard');
      } else {
        setError('Registration successful! Please log in to continue.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || err.message || 
        'Registration failed. Please check your details and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Register your company
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Get started with BuildTrack for smart site tracking
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
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            placeholder="e.g. Lanka Builders Pvt Ltd"
            disabled={isLoading}
            {...register('companyName')}
            className={errors.companyName ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {errors.companyName && (
            <p className="text-xs font-medium text-destructive">{errors.companyName.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              placeholder="Chamara"
              disabled={isLoading}
              {...register('firstName')}
              className={errors.firstName ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.firstName && (
              <p className="text-xs font-medium text-destructive">{errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              placeholder="Perera"
              disabled={isLoading}
              {...register('lastName')}
              className={errors.lastName ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.lastName && (
              <p className="text-xs font-medium text-destructive">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="owner@company.com"
            disabled={isLoading}
            {...register('email')}
            className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {errors.email && (
            <p className="text-xs font-medium text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone number (Optional)</Label>
          <Input
            id="phone"
            placeholder="e.g. +94771234567"
            disabled={isLoading}
            {...register('phone')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Minimum 8 characters"
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
              Creating account...
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-amber-600 hover:text-amber-500 hover:underline"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
