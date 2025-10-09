import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// export const API_URL = "http://47.129.158.3:3000";
export const API_URL = "http://localhost:3000";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
