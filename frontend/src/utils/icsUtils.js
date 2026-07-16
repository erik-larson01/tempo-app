// Utility functions for handling ICS preview data

const ESTIMATED_HOURS_MIN = 0.5
const ESTIMATED_HOURS_MAX = 500
const ESTIMATED_HOURS_STEP = 0.5
const DIFFICULTY_MIN = 1
const DIFFICULTY_MAX = 10

export function formatPreviewDate(dateString) {
  if (!dateString) return '—'

  const date = new Date(`${dateString}T00:00:00`)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function getDueLabel(dateString) {
  return {
    label: formatPreviewDate(dateString),
    className: 'bg-gray-100 text-gray-500',
  }
}

export function normalizeEstimatedHours(value) {
  if (value === '' || value === null || value === undefined) return null

  const numericValue = Number(value)
  if (Number.isNaN(numericValue)) return null

  const roundedValue = Math.round(numericValue / ESTIMATED_HOURS_STEP) * ESTIMATED_HOURS_STEP
  return Math.min(Math.max(roundedValue, ESTIMATED_HOURS_MIN), ESTIMATED_HOURS_MAX)
}

export function normalizeDifficulty(value) {
  if (value === '' || value === null || value === undefined) return null

  const numericValue = Number(value)
  if (Number.isNaN(numericValue)) return null

  return Math.min(Math.max(Math.round(numericValue), DIFFICULTY_MIN), DIFFICULTY_MAX)
}