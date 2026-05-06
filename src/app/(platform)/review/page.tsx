import { createClient } from '@/lib/supabase/server'
import { getAllConcepts, getConceptById } from '@/lib/curriculum'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getDifficultyColor, getMasteryColor, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { RotateCcw, CheckCircle2, Clock } from 'lucide-react'

export default async function ReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: progressRows } = await supabase
    .from('user_concept_progress')
    .select('*')
    .eq('user_id', user!.id)
    .not('next_review_at', 'is', null)
    .order('next_review_at', { ascending: true })

  const now = new Date()

  const items = (progressRows ?? []).map((p: { concept_id: string; mastery_score: number; next_review_at: string; attempts: number; last_attempted_at: string }) => {
    const concept = getConceptById(p.concept_id)
    if (!concept) return null
    const reviewDate = new Date(p.next_review_at)
    const urgency = reviewDate < now ? 'overdue' : reviewDate.toDateString() === now.toDateString() ? 'due-today' : 'upcoming'
    return { concept, progress: p, urgency }
  }).filter(Boolean) as Array<{ concept: ReturnType<typeof getConceptById>; progress: { concept_id: string; mastery_score: number; next_review_at: string; attempts: number; last_attempted_at: string }; urgency: string }>

  const overdue = items.filter(i => i.urgency === 'overdue')
  const dueToday = items.filter(i => i.urgency === 'due-today')
  const upcoming = items.filter(i => i.urgency === 'upcoming').slice(0, 10)

  const totalDue = overdue.length + dueToday.length

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Review Queue</h1>
        <p className="text-slate-500 mt-1">Spaced repetition keeps concepts fresh. Review at the right time to maximize retention.</p>
      </div>

      {totalDue === 0 ? (
        <Card className="border-green-200 bg-green-50 mb-8">
          <CardContent className="p-6 flex items-center gap-4">
            <CheckCircle2 className="h-8 w-8 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900">You&apos;re all caught up!</p>
              <p className="text-sm text-green-700 mt-0.5">No reviews due. Check back later or explore new concepts.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-orange-200 bg-orange-50 mb-6">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RotateCcw className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-900">{totalDue} concept{totalDue > 1 ? 's' : ''} due for review</p>
                <p className="text-xs text-orange-700">{overdue.length} overdue, {dueToday.length} due today</p>
              </div>
            </div>
            {overdue.length > 0 && (
              <Link href={`/quiz/${overdue[0].concept!.id}`}>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">Start Review</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {overdue.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-3">Overdue</h2>
          <div className="space-y-2">
            {overdue.map(({ concept, progress }) => concept && (
              <ReviewCard key={concept.id} concept={concept} progress={progress} urgency="overdue" />
            ))}
          </div>
        </section>
      )}

      {dueToday.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-3">Due Today</h2>
          <div className="space-y-2">
            {dueToday.map(({ concept, progress }) => concept && (
              <ReviewCard key={concept.id} concept={concept} progress={progress} urgency="due-today" />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Coming Up</h2>
          <div className="space-y-2">
            {upcoming.map(({ concept, progress }) => concept && (
              <ReviewCard key={concept.id} concept={concept} progress={progress} urgency="upcoming" />
            ))}
          </div>
        </section>
      )}

      {items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">You haven&apos;t studied any concepts yet.</p>
          <Link href="/learn">
            <Button>Start Learning</Button>
          </Link>
        </div>
      )}
    </div>
  )
}

function ReviewCard({
  concept,
  progress,
  urgency,
}: {
  concept: NonNullable<ReturnType<typeof getConceptById>>
  progress: { mastery_score: number; next_review_at: string; attempts: number; last_attempted_at: string }
  urgency: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              urgency === 'overdue' ? 'bg-red-500' :
              urgency === 'due-today' ? 'bg-orange-500' : 'bg-slate-300'
            }`} />
            <div>
              <p className="font-medium text-slate-900 text-sm">{concept.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs font-medium ${getMasteryColor(progress.mastery_score)}`}>
                  {progress.mastery_score}% mastery
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {urgency === 'upcoming' ? `Due ${formatDate(progress.next_review_at)}` : 'Due now'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getDifficultyColor(concept.difficulty)}`}>
              {concept.difficulty}
            </span>
            <Link href={`/quiz/${concept.id}`}>
              <Button size="sm" variant={urgency === 'overdue' ? 'default' : 'outline'} className="text-xs h-7 px-3">
                Quiz
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
