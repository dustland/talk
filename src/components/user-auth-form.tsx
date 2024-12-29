'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { AuthError } from '@supabase/supabase-js';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { signInWithGoogle } from '@/lib/supabase/auth';
import { cn } from '@/lib/utils';

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  redirect?: string;
}

export function UserAuthForm({
  className,
  redirect,
  ...props
}: UserAuthFormProps) {
  const { toast } = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = React.useState<boolean>(false);
  const router = useRouter();

  const handleAuthError = (error: AuthError) => {
    console.error('Auth error:', error);
    toast({
      title: 'Authentication error',
      description: error.message || 'An error occurred during authentication',
      variant: 'destructive',
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const { error } = await signInWithGoogle();
      if (error) {
        handleAuthError(error);
      }
    } catch (error) {
      handleAuthError(error as AuthError);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <Button
        variant="outline"
        type="button"
        disabled={isGoogleLoading}
        onClick={handleGoogleSignIn}
        className="bg-background"
      >
        {isGoogleLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 h-4 w-4" />
        )}
        Continue with Google
      </Button>
    </div>
  );
}
