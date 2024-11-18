import Link from "next/link";
import Image from "next/image";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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
          <span className="text-base font-medium text-white/70">User</span>
        </Link>
      </div>
      <div className="flex-1 mt-6 text-white">{children}</div>
    </div>
  );
}
