import { Icons } from "@/components/icons";

interface ErrorProps {
  message?: string;
}
export function Error({ message = "Something went wrong" }: ErrorProps) {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[100px] text-destructive">
      <Icons.alert className="h-4 w-4 mr-2" />
      <div className="text-sm">{message}</div>
    </div>
  );
}
