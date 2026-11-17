import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function validateUsername(username: string): boolean {
  return /^[a-z0-9_]{3,30}$/.test(username);
}

