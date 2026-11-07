/**
 * ApexProp AI — Utility Formatters
 */

export function formatINR(val: number | string): string {
  if (typeof val === 'string') return val;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    return date.toLocaleDateString('en-GB');
  } catch {
    return dateString;
  }
}

export function getSeverityStyle(severity: string): { bg: string; text: string; border: string } {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
      return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40' };
    case 'HIGH':
      return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40' };
    case 'MEDIUM':
      return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' };
    case 'LOW':
      return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' };
    default:
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' };
  }
}
