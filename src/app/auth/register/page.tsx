"use client";

import Image from 'next/image';
import Link from 'next/link';
import { UserAuthForm } from '@/components/user-auth-form';


export default function RegisterPage() {
  return (
    <div className="mx-auto container flex h-screen w-screen flex-col items-center justify-center">
      <div className="flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col gap-4 text-center">
            <Image
              alt="logo"
              width={48}
              height={48}
              src="/images/logo.svg"
              className="mx-auto h-20 w-20"
            />
            <h1 className="text-2xl font-semibold tracking-tight">Create Account</h1>
            <p className="text-sm text-muted-foreground">Sign up with your Google account</p>
          </div>
          <UserAuthForm isSignUp />
          <p className="px-8 text-center text-sm text-muted-foreground">
            <Link href="/auth/login" className="hover:text-brand underline underline-offset-4">
              Already have an account? Login now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}