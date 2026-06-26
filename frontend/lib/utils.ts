import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen) + '…'
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function riskColor(level: 'HIGH' | 'MEDIUM' | 'LOW'): {
  bg: string
  text: string
  border: string
} {
  switch (level) {
    case 'HIGH':
      return { bg: 'bg-[rgba(220,38,38,0.10)]', text: 'text-[#DC2626]', border: 'border-[#DC2626]/30' }
    case 'MEDIUM':
      return { bg: 'bg-[rgba(217,119,6,0.10)]', text: 'text-[#D97706]', border: 'border-[#D97706]/30' }
    case 'LOW':
      return { bg: 'bg-[rgba(22,163,74,0.10)]', text: 'text-[#16A34A]', border: 'border-[#16A34A]/30' }
  }
}

export function confidenceColor(score: number): string {
  if (score >= 0.9) return '#16A34A'
  if (score >= 0.75) return '#D97706'
  return '#DC2626'
}
