'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    // Self-service reset needs a backend endpoint and working SMTP, neither of
    // which exists yet. This screen used to wait a second and claim an email
    // had been sent, which left people waiting for mail that was never coming.
    // Until it's built, say what actually recovers the account.
    setIsSuccess(true);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Reset password
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          How to get back into your account
        </p>
      </div>

      {isSuccess ? (
        <div className="space-y-4">
          <Alert className="border-warning bg-warning-subtle text-warning">
            <CheckCircle2 className="h-4 w-4 text-warning" />
            <AlertTitle>Ask your company owner to reset it</AlertTitle>
            <AlertDescription>
              Automatic password reset emails aren&apos;t available yet. Your
              company owner can set a new password for you from{' '}
              <span className="font-semibold">Settings → Team</span>, and you
              can sign in with it straight away.
            </AlertDescription>
          </Alert>
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full border-zinc-200 dark:border-zinc-800">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to log in
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              {...register('email')}
              className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.email && (
              <p className="text-xs font-medium text-destructive">{errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full bg-amber-500 text-zinc-950 hover:bg-amber-600 font-semibold">
            Continue
          </Button>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-amber-500 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to log in
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
