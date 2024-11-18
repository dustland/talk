import { Icons } from "@/components/icons";

export function Loading() {
  return (
    <div className="flex items-center justify-center w-full h-full text-white/70">
      <Icons.spinner className="h-4 w-4 mr-2 animate-spin" />
      <div className="text-sm">Loading...</div>
    </div>
  );
}
