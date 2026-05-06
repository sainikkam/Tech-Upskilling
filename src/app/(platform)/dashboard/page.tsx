import { createClient } from '@/lib/supabase/server'
import { curriculum, getAllConcepts } from '@/lib/curriculum'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getMasteryLabel, getMasteryColor } from '@/lib/utils'
import Link from 'next/link'
import { Brain, BookOpen, RotateCcw, Flame, Target } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user progress
  const { data: progressRows } = await supabase
    .from('user_concept_progress')
    .select('*')
    .eq('user_id', user!.id)

  const { data: sessions } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('user_id', user!.id)
    .order('completed_at', { ascending: false })
    .limit(5)

  const progressMap = new Map((progressRows ?? []).map((p: { concept_id: string; mastery_score: number; next_review_at: string | null; attempts: number }) => [p.concept_id, p]))
  const allConcepts = getAllConcepts()
  const now = new Date()

  // Stats
  const studiedConcepts = progressRows?.length ?? 0
  const reviewDue = (progressRows ?? []).filter((p: { next_review_at: string | null; mastery_score: number }) =>
    p.next_review_at && new Date(p.next_review_at) <= now
  ).length
  const totalQuizzes = sessions?.length ?? 0
  const avgMastery = studiedConcepts > 0
    ? Math.round((progressRows ?? []).reduce((sum: number, p: { mastery_score: number }) => sum + p.mastery_score, 0) / studiedConcepts)
    : 0

  // Track mastery
  const trackMastery = curriculum.map(track => {
    const concepts = track.topics.flatMap(t => t.concepts)
    const studied = concepts.filter(c => progressMap.has(c.id))
    const avgScore = studied.length > 0
      ? Math.round(studied.reduce((sum, c) => sum + (progressMap.get(c.id)?.mastery_score ?? 0), 0) / studied.length)
      : 0
    return { track, avgScore, studied: studied.length, total: concepts.length }
  })

  // Recommended next concept
  const unstudied = allConcepts.filter(c => !progressMap.has(c.id))
  const recommended = unstudied.find(c =>
    !c.prerequisites || c.prerequisites.every(prereqId => (progressMap.get(prereqId)?.mastery_score ?? 0) >= 50)
  ) ?? unstudied[0]

  // Weak concepts (studied but low mastery)
  const weakConcepts = allConcepts
    .filter(c => (progressMap.get(c.id)?.mastery_score ?? -1) > 0 && (progressMap.get(c.id)?.mastery_score ?? 0) < 60)
    .slice(0, 3)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Track your progress toward AI engineering mastery.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Avg Mastery', value: `${avgMastery}%`, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Concepts Studied', value: studiedConcepts, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Quizzes Taken', value: totalQuizzes, icon: Brain, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Due for Review', value: reviewDue, icon: RotateCcw, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Track progress */}
        <div className="col-span-2 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Track Progress</h2>
          {trackMastery.map(({ track, avgScore, studied, total }) => (
            <Card key={track.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{track.icon}</span>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{track.title}</p>
                      <p className="text-xs text-slate-500">{studied}/{total} concepts studied</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${getMasteryColor(avgScore)}`}>
                      {getMasteryLabel(avgScore)}
                    </span>
                    <p className="text-xs text-slate-400">{avgScore}%</p>
                  </div>
                </div>
                <Progress value={studied > 0 ? avgScore : 0} className="h-1.5" />
                <div className="flex justify-end mt-2">
                  <Link href={`/learn/${track.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Study →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Recommended */}
          {recommended && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Recommended Next
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="font-medium text-slate-900 text-sm">{recommended.title}</p>
                <p className="text-xs text-slate-500 mt-1 mb-3">{recommended.description}</p>
                <Badge variant="secondary" className="text-xs mb-3 capitalize">{recommended.difficulty}</Badge>
                <div className="flex gap-2">
                  <Link href={`/learn/${recommended.trackId}/${recommended.id}`} className="flex-1">
                    <Button size="sm" className="w-full text-xs">Study</Button>
                  </Link>
                  <Link href={`/quiz/${recommended.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full text-xs">Quiz</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review due */}
          {reviewDue > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <RotateCcw className="h-4 w-4 text-orange-600" />
                  <p className="font-medium text-orange-900 text-sm">{reviewDue} concept{reviewDue > 1 ? 's' : ''} due for review</p>
                </div>
                <p className="text-xs text-orange-700 mb-3">Spaced repetition keeps knowledge fresh.</p>
                <Link href="/review">
                  <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700 text-xs">
                    Start Review
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Weak concepts */}
          {weakConcepts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Focus Areas</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {weakConcepts.map(concept => (
                  <Link key={concept.id} href={`/quiz/${concept.id}`}>
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <p className="text-xs font-medium text-slate-700">{concept.title}</p>
                      <span className={`text-xs font-semibold ${getMasteryColor(progressMap.get(concept.id)?.mastery_score ?? 0)}`}>
                        {progressMap.get(concept.id)?.mastery_score ?? 0}%
                      </span>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
