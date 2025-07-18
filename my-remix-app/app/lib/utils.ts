import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

 
import { format } from 'date-fns';

/**
 * Safely parses a JSON string and returns a fallback on error.
 */
export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch (err) {
    console.error('JSON parse error:', err);
    return fallback;
  }
}

/**
 * Formats a Date object to a readable string.
 */
export function formatDate(date: Date | string, formatStr = 'yyyy-MM-dd HH:mm:ss'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatStr);
}

/**
 * Generates a URL-friendly slug from a string.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Gets a required environment variable or throws an error.
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Logs an error to console or external service (like Sentry).
 */
export function logError(error: unknown, context = ''): void {
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`[Error] ${context}:`, msg);
  // Integrate external services here if needed.
}

/**
 * Deep merges two objects.
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      target[key] = deepMerge(target[key] || {}, source[key]!);
    } else {
      target[key] = source[key]!;
    }
  }
  return target;
}


export function generateCustomID(prefix: string) {
  const digit = Math.floor(Math.random() * 10); // single digit (0–9)
  const letters = Array.from({ length: 3 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('');

  return `${prefix}-${digit}${letters}`;
}

export function formatPendingSince(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const mins = diffMins % 60;
  const hours = diffHours % 24;
  const days = diffDays;

  // Format date as MM/DD/YYYY
  const formattedDate = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  // Format time as 12-hour with AM/PM
  const formattedTime = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  let relative = "";
  if (days > 0) relative += `${days}d, `;
  if (hours > 0 || days > 0) relative += `${hours}h, `;
  relative += `${mins}m ago`;

  return { relative, formattedDate, formattedTime };
}
