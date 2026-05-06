import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from '@/lib/ai/client'
import { PROMPTS } from '@/lib/ai/prompts'
import { getConceptById } from '@/lib/curriculum'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ conceptId: string }> }
) {
  const { conceptId } = await params
  const concept = getConceptById(conceptId)
  if (!concept) {
    return NextResponse.json({ error: 'Concept not found' }, { status: 404 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check for cached explanation
  const { data: cached } = await supabase
    .from('concept_explanations')
    .select('explanation')
    .eq('concept_id', conceptId)
    .single()

  if (cached?.explanation) {
    return NextResponse.json({ explanation: cached.explanation })
  }

  // Generate with Claude
  const prompt = PROMPTS.EXPLAIN_CONCEPT(
    concept.title,
    concept.description,
    concept.keyPoints,
    concept.difficulty
  )

  const explanation = await generateText(prompt)

  // Cache it
  await supabase
    .from('concept_explanations')
    .upsert({ concept_id: conceptId, explanation, generated_at: new Date().toISOString() })

  return NextResponse.json({ explanation })
}
