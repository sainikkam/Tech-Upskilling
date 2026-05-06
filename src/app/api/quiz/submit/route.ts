import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from '@/lib/claude/client'
import { PROMPTS } from '@/lib/claude/prompts'
import { calcNextReviewDate } from '@/lib/utils'
import type { QuizQuestion, QuizResult, QuizResponse } from '@/types'

export async function POST(req: NextRequest) {
  const { sessionId, conceptId, questions, userAnswers } = await req.json() as {
    sessionId: string
    conceptId: string
    questions: QuizQuestion[]
    userAnswers: number[]
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Build responses
  const responses: QuizResponse[] = questions.map((q, i) => ({
    questionId: q.id,
    question: q.question,
    userAnswer: userAnswers[i],
    correctAnswer: q.correct,
    isCorrect: userAnswers[i] === q.correct,
    explanation: q.explanation,
  }))

  const correctCount = responses.filter(r => r.isCorrect).length
  const score = Math.round((correctCount / questions.length) * 100)

  // Persist responses
  await supabase.from('quiz_responses').insert(
    responses.map(r => ({
      session_id: sessionId,
      question_text: r.question,
      user_answer: questions[r.userAnswer]?.options[r.userAnswer] ?? '',
      correct_answer: questions[r.correctAnswer]?.options[r.correctAnswer] ?? '',
      is_correct: r.isCorrect,
      explanation: r.explanation,
      concept_id: conceptId,
    }))
  )

  // Update quiz session
  await supabase
    .from('quiz_sessions')
    .update({
      score,
      correct_answers: correctCount,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  // Update user progress
  const { data: existing } = await supabase
    .from('user_concept_progress')
    .select('mastery_score, attempts')
    .eq('user_id', user.id)
    .eq('concept_id', conceptId)
    .single()

  const attempts = (existing?.attempts ?? 0) + 1
  // Weighted average: new score gets 60% weight, history gets 40%
  const prevMastery = existing?.mastery_score ?? 0
  const newMasteryScore = existing
    ? Math.round(score * 0.6 + prevMastery * 0.4)
    : score

  const nextReviewAt = calcNextReviewDate(newMasteryScore, attempts)

  await supabase.from('user_concept_progress').upsert({
    user_id: user.id,
    concept_id: conceptId,
    mastery_score: newMasteryScore,
    attempts,
    last_attempted_at: new Date().toISOString(),
    next_review_at: nextReviewAt.toISOString(),
  })

  // Generate AI feedback
  let feedback = ''
  try {
    feedback = await generateText(
      PROMPTS.QUIZ_FEEDBACK(
        conceptId,
        score,
        responses.map(r => ({ question: r.question, correct: r.isCorrect, explanation: r.explanation }))
      )
    )
  } catch {
    feedback = score >= 80
      ? 'Great work! Keep practicing to maintain your mastery.'
      : score >= 60
      ? 'Good effort. Review the explanations for missed questions and try again.'
      : 'Keep at it! Review the concept explanation and try again.'
  }

  const result: QuizResult = {
    sessionId,
    conceptId,
    score,
    totalQuestions: questions.length,
    correctAnswers: correctCount,
    responses,
    newMasteryScore,
    feedback,
  }

  return NextResponse.json({ result })
}
