import { Icons } from "@/components/icons";

export function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center text-white/70">
      <div className="flex items-center">
        <Icons.pinwheel className="h-4 w-4 mr-2 animate-spin" />
        <div className="text-sm">Loading...</div>
      </div>
    </div>
  );
}
