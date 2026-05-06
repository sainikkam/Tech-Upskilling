import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function getMasteryLabel(score: number): string {
  if (score >= 90) return 'Expert'
  if (score >= 70) return 'Proficient'
  if (score >= 50) return 'Learning'
  if (score >= 20) return 'Beginner'
  return 'Not Started'
}

export function getMasteryColor(score: number): string {
  if (score >= 90) return 'text-green-600'
  if (score >= 70) return 'text-blue-600'
  if (score >= 50) return 'text-yellow-600'
  if (score >= 20) return 'text-orange-600'
  return 'text-slate-400'
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'beginner': return 'bg-green-100 text-green-700'
    case 'intermediate': return 'bg-yellow-100 text-yellow-700'
    case 'advanced': return 'bg-red-100 text-red-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

// Spaced repetition: calculate next review date based on mastery score and attempts
export function calcNextReviewDate(masteryScore: number, attemptNumber: number): Date {
  const now = new Date()
  let daysUntilReview: number

  if (masteryScore >= 80) {
    // Good performance — exponential backoff
    daysUntilReview = Math.min(Math.pow(2, attemptNumber - 1), 30)
  } else if (masteryScore >= 60) {
    daysUntilReview = 1
  } else {
    // Poor performance — review soon
    daysUntilReview = 0.167 // 4 hours
  }

  now.setTime(now.getTime() + daysUntilReview * 24 * 60 * 60 * 1000)
  return now
}
