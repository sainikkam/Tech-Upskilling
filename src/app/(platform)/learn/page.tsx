import { createClient } from '@/lib/supabase/server'
import { curriculum } from '@/lib/curriculum'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function LearnPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: progressRows } = await supabase
    .from('user_concept_progress')
    .select('concept_id, mastery_score')
    .eq('user_id', user!.id)

  const progressMap = new Map((progressRows ?? []).map((p: { concept_id: string; mastery_score: number }) => [p.concept_id, p.mastery_score]))

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Learning Tracks</h1>
        <p className="text-slate-500 mt-1">Four tracks to take you from zero to industry-grade AI engineer.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {curriculum.map(track => {
          const allConcepts = track.topics.flatMap(t => t.concepts)
          const studied = allConcepts.filter(c => progressMap.has(c.id))
          const avgMastery = studied.length > 0
            ? Math.round(studied.reduce((sum, c) => sum + (progressMap.get(c.id) ?? 0), 0) / studied.length)
            : 0
          const pct = Math.round((studied.length / allConcepts.length) * 100)

          return (
            <Link key={track.id} href={`/learn/${track.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{track.icon}</span>
                      <div>
                        <CardTitle className="text-base">{track.title}</CardTitle>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {studied.length}/{allConcepts.length} concepts
                        </Badge>
                      </div>
                    </div>
                    {studied.length > 0 && (
                      <span className="text-sm font-semibold text-slate-600">{avgMastery}%</span>
                    )}
                  </div>
                  <CardDescription className="text-xs leading-relaxed mt-2">{track.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Progress</span>
                      <span>{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                  <div className="space-y-1">
                    {track.topics.map(topic => (
                      <div key={topic.id} className="flex items-center justify-between text-xs text-slate-500">
                        <span>{topic.title}</span>
                        <span>{topic.concepts.filter(c => progressMap.has(c.id)).length}/{topic.concepts.length}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
