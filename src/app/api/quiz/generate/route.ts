import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateJSON } from '@/lib/claude/client'
import { PROMPTS } from '@/lib/claude/prompts'
import { getConceptById } from '@/lib/curriculum'
import type { QuizQuestion } from '@/types'

export async function POST(req: NextRequest) {
  const { conceptId } = await req.json()

  const concept = getConceptById(conceptId)
  if (!concept) {
    return NextResponse.json({ error: 'Concept not found' }, { status: 404 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get current mastery to adapt difficulty
  const { data: progress } = await supabase
    .from('user_concept_progress')
    .select('mastery_score, attempts')
    .eq('user_id', user.id)
    .eq('concept_id', conceptId)
    .single()

  const masteryScore = progress?.mastery_score ?? 0
  const numQuestions = 5

  const prompt = PROMPTS.GENERATE_QUIZ(
    concept.title,
    concept.description,
    concept.keyPoints,
    masteryScore,
    numQuestions
  )

  const data = await generateJSON<{ questions: QuizQuestion[] }>(prompt)

  // Create quiz session
  const { data: session, error: sessionError } = await supabase
    .from('quiz_sessions')
    .insert({
      user_id: user.id,
      concept_id: conceptId,
      total_questions: numQuestions,
    })
    .select('id')
    .single()

  if (sessionError) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  return NextResponse.json({ questions: data.questions, sessionId: session.id })
}
