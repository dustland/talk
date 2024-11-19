import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import Image from "next/image";
import { Nav } from "@/components/nav";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-900 min-h-screen">
          <div className="container mx-auto p-4 min-h-screen flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/talk.svg"
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
            </div>
            <div className="flex-1 mt-6 text-white">{children}</div>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
