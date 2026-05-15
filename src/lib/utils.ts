import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import CryptoJS from 'crypto-js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hashPin(pin: string): string {
  // Simple salt-less hash for demonstration as per requirement (store hashed PIN only)
  // In a real production app, use a server-side salt or argon2
  return CryptoJS.SHA256(pin).toString();
}

export function validateUsername(username: string): boolean {
  return /^[a-z0-9_]{3,30}$/.test(username);
}

export function validatePin(pin: string): boolean {
  return /^\d{4,8}$/.test(pin);
}
