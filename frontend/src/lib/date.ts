/**
 * Standardized Date Formatting Utilities for AyuCTMS
 */

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  try {
    // Check if format is YYYY-MM-DD
    const parts = dateString.split('T')[0].split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const monthIndex = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const date = new Date(Date.UTC(year, monthIndex, day))
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
    }
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return isoString
    return `${d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })}, ${d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    })} UTC`
  } catch {
    return isoString
  }
}

export function formatRelativeDate(isoString: string | null | undefined): string {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return isoString
    const now = new Date()
    const diffMs = d.getTime() - now.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays > 0) return `in ${diffDays} days`
    return `${Math.abs(diffDays)} days ago`
  } catch {
    return isoString
  }
}
