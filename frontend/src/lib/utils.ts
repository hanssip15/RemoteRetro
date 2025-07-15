import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCategoryEmoji(format: string, retroFormat: string) {
  if (retroFormat === "happy_sad_confused") {
    if (format === "format_1") return "😀";
    if (format === "format_2") return "😢";
    if (format === "format_3") return "🤔";
  } else {
    if (format === "format_1") return "🟢";
    if (format === "format_2") return "🛑";
    if (format === "format_3") return "🔄";
  }
  return "";
}
