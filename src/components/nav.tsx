"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icons } from "./icons";

export function Nav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-4 md:gap-6">
      {[
        { label: "Chat", icon: Icons.chat, href: "/chat" },
        { label: "Practice", icon: Icons.practice, href: "/practice" },
        { label: "Test", icon: Icons.test, href: "/test" },
        { label: "Discover", icon: Icons.discover, href: "/questions" },
        { label: <Icons.settings className="w-5 h-5" />, href: "/account" },
      ].map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-2 text-white/70 hover:text-white transition-colors text-center font-bold",
            pathname === item.href && "text-white"
          )}
        >
          {item.icon && <item.icon className="w-4 h-4" />}
          {item.label}
        </Link>
      ))}
      {/* <Link
        href="https://github.com/dustland/talk"
        target="_blank"
        className="text-white/70 hover:text-white transition-colors"
      >
        <Icons.gitHub className="w-5 h-5" />
      </Link> */}
    </div>
  );
}
