/**
 * Standardized Data Formatters for AyuCTMS
 */

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0'
  return new Intl.NumberFormat('en-IN').format(value)
}

export function formatPercentage(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return '0%'
  return `${value.toFixed(decimals)}%`
}

export const formatPercent = formatPercentage

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export const formatBytes = formatFileSize

export function formatEnumLabel(value: string | null | undefined): string {
  if (!value) return '—'
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function truncateText(text: string | null | undefined, maxLength = 40): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}
