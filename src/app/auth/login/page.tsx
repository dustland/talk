'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { UserAuthForm } from '@/components/user-auth-form';

function LoginContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  return (
    <div className="mx-auto container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col gap-4 text-center">
          <Image
            alt="logo"
            width={48}
            height={48}
            src="/logo.svg"
            className="mx-auto h-16 w-16"
          />
          <h1 className="text-4xl font-semibold tracking-tight">Talk</h1>
        </div>
        <UserAuthForm redirect={redirect} />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
