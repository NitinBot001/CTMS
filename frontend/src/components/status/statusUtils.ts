export type StatusCategory = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export function getStatusCategory(status: string | null | undefined): StatusCategory {
  if (!status) return 'neutral'
  const s = status.toLowerCase()

  if (['active', 'approved', 'activated', 'completed', 'verified', 'resolved', 'enrolled', 'eligible', 'registered'].includes(s)) {
    return 'success'
  }
  if (['pending', 'under_review', 'in_progress', 'conditional', 'initiated', 'submitted', 'reported', 'randomized', 'changes_requested'].includes(s)) {
    return 'warning'
  }
  if (['suspended', 'terminated', 'rejected', 'expired', 'screen_failed', 'discontinued', 'withdrawn'].includes(s)) {
    return 'danger'
  }
  if (['planned', 'screened', 'open', 'identified'].includes(s)) {
    return 'info'
  }
  return 'neutral' // draft, not_submitted, archived, etc.
}
