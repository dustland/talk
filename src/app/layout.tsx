import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import Image from "next/image";
import { Nav } from "@/components/nav";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AuthButton } from "@/components/auth-button";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Talk",
  description: "Practice for the IELTS Speaking Test",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      style={{ "--header-height": "3rem" } as React.CSSProperties}
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex flex-col h-screen bg-gradient-to-r from-indigo-500 to-indigo-900">
          {/* Fixed Header */}
          <header className="z-50 fixed top-0 left-0 right-0 h-[var(--header-height)]">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-indigo-500/20 backdrop-blur-lg" />

            {/* Header content */}
            <div className="relative z-10 flex items-center justify-between h-full mx-auto container px-4">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo.svg"
                  alt="Talk"
                  width={32}
                  height={32}
                  className="w-6 h-6 md:w-8 md:h-8"
                  priority
                />
                <span className="text-lg hidden md:block text-white font-bold">
                  Talk
                </span>
              </Link>
              <div className="flex items-center gap-2">
                <Nav />
              </div>
              <AuthButton />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 pt-[var(--header-height)]">
            <ScrollArea className="h-[calc(100vh-var(--header-height))]">
              <div className="container mx-auto p-4 min-h-[calc(100vh-var(--header-height))] flex flex-col">
                {children}
              </div>
            </ScrollArea>
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
