import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toLocaleDateString();
}
