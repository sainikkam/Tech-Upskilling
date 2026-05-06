import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAllConcepts, getConceptById } from '@/lib/curriculum'
import type { AnalyticsSummary, Track } from '@/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: progressRows } = await supabase
    .from('user_concept_progress')
    .select('*')
    .eq('user_id', user.id)

  const { data: sessions } = await supabase
    .from('quiz_sessions')
    .select('id, completed_at')
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)

  const now = new Date()
  const allConcepts = getAllConcepts()
  const progressMap = new Map((progressRows ?? []).map((p: { concept_id: string; mastery_score: number; next_review_at: string | null }) => [
    p.concept_id,
    { mastery: p.mastery_score, nextReview: p.next_review_at }
  ]))

  const reviewDue = (progressRows ?? []).filter((p: { next_review_at: string | null }) =>
    p.next_review_at && new Date(p.next_review_at) <= now
  ).length

  const totalStudied = progressRows?.length ?? 0
  const overallMastery = totalStudied > 0
    ? Math.round((progressRows ?? []).reduce((sum: number, p: { mastery_score: number }) => sum + p.mastery_score, 0) / totalStudied)
    : 0

  // Per-track mastery
  const tracks: Track[] = ['dsa', 'ml', 'ai-engineering', 'system-design']
  const trackMastery: Record<Track, number> = {} as Record<Track, number>
  for (const trackId of tracks) {
    const trackConcepts = allConcepts.filter(c => c.trackId === trackId)
    const studied = trackConcepts.filter(c => progressMap.has(c.id))
    trackMastery[trackId] = studied.length > 0
      ? Math.round(studied.reduce((sum, c) => sum + (progressMap.get(c.id)?.mastery ?? 0), 0) / studied.length)
      : 0
  }

  // Strong concepts (mastery >= 80)
  const strongConcepts = (progressRows ?? [])
    .filter((p: { mastery_score: number }) => p.mastery_score >= 80)
    .map((p: { concept_id: string }) => getConceptById(p.concept_id)?.title ?? p.concept_id)
    .slice(0, 5)

  // Weak concepts (studied but mastery < 50)
  const weakConcepts = (progressRows ?? [])
    .filter((p: { mastery_score: number }) => p.mastery_score > 0 && p.mastery_score < 50)
    .map((p: { concept_id: string }) => getConceptById(p.concept_id)?.title ?? p.concept_id)
    .slice(0, 5)

  // Streak calculation (consecutive days with quizzes)
  const completedDates = (sessions ?? [])
    .map((s: { completed_at: string | null }) => s.completed_at ? new Date(s.completed_at).toDateString() : null)
    .filter(Boolean)
  const uniqueDates = [...new Set(completedDates)].sort().reverse()
  let streakDays = 0
  for (let i = 0; i < uniqueDates.length; i++) {
    const expected = new Date()
    expected.setDate(expected.getDate() - i)
    if (uniqueDates[i] === expected.toDateString()) streakDays++
    else break
  }

  const summary: AnalyticsSummary = {
    overallMastery,
    trackMastery,
    strongConcepts,
    weakConcepts,
    reviewDue,
    totalConceptsStudied: totalStudied,
    totalQuizzesTaken: sessions?.length ?? 0,
    streakDays,
  }

  return NextResponse.json({ summary, progressRows })
}
