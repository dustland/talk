"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Nav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2">
      {[
        { label: "Home", href: "/" },
        { label: "Chat", href: "/chat" },
        { label: "Practice", href: "/practice" },
        { label: "Account", href: "/account" },
      ].map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-white/70 hover:text-white transition-colors w-16 md:w-20 text-center",
            pathname === item.href && "text-white font-bold"
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
