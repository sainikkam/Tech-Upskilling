import { createClient } from '@/lib/supabase/server'
import { getTrackById } from '@/lib/curriculum'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { getDifficultyColor, getMasteryColor } from '@/lib/utils'
import Link from 'next/link'
import { ChevronRight, Lock, CheckCircle2 } from 'lucide-react'

interface Props {
  params: Promise<{ trackId: string }>
}

export default async function TrackPage({ params }: Props) {
  const { trackId } = await params
  const track = getTrackById(trackId)
  if (!track) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: progressRows } = await supabase
    .from('user_concept_progress')
    .select('concept_id, mastery_score, attempts')
    .eq('user_id', user!.id)

  const progressMap = new Map((progressRows ?? []).map((p: { concept_id: string; mastery_score: number; attempts: number }) => [
    p.concept_id,
    { mastery: p.mastery_score, attempts: p.attempts }
  ]))

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-2">
        <Link href="/learn" className="text-sm text-slate-500 hover:text-slate-700">← Learning Tracks</Link>
      </div>
      <div className="flex items-center gap-4 mb-8">
        <span className="text-4xl">{track.icon}</span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{track.title}</h1>
          <p className="text-slate-500 text-sm mt-1">{track.description}</p>
        </div>
      </div>

      <div className="space-y-8">
        {track.topics.map((topic, topicIdx) => {
          const topicConcepts = topic.concepts
          const studied = topicConcepts.filter(c => progressMap.has(c.id)).length
          const avgMastery = studied > 0
            ? Math.round(topicConcepts.filter(c => progressMap.has(c.id)).reduce((sum, c) => sum + (progressMap.get(c.id)?.mastery ?? 0), 0) / studied)
            : 0

          return (
            <div key={topic.id}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-semibold text-slate-900">{topicIdx + 1}. {topic.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{topic.description}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>{studied}/{topicConcepts.length} done</div>
                  <Progress value={studied > 0 ? (studied / topicConcepts.length) * 100 : 0} className="h-1 w-20 mt-1" />
                </div>
              </div>

              <div className="space-y-2">
                {topicConcepts.map(concept => {
                  const progress = progressMap.get(concept.id)
                  const prereqsMet = !concept.prerequisites || concept.prerequisites.every(
                    prereqId => (progressMap.get(prereqId)?.mastery ?? 0) >= 40
                  )
                  const isUnlocked = prereqsMet
                  const mastery = progress?.mastery ?? 0

                  return (
                    <Card
                      key={concept.id}
                      className={`transition-shadow ${isUnlocked ? 'hover:shadow-sm cursor-pointer' : 'opacity-60'}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${mastery >= 70 ? 'bg-green-100' : 'bg-slate-100'}`}>
                              {mastery >= 70 ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : !isUnlocked ? (
                                <Lock className="h-3 w-3 text-slate-400" />
                              ) : (
                                <span className="text-xs font-semibold text-slate-500">{concept.order}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-slate-900 text-sm">{concept.title}</p>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getDifficultyColor(concept.difficulty)}`}>
                                  {concept.difficulty}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 truncate">{concept.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 ml-4">
                            {progress && (
                              <div className="text-right">
                                <p className={`text-xs font-semibold ${getMasteryColor(mastery)}`}>{mastery}%</p>
                                <p className="text-xs text-slate-400">{progress.attempts} quiz{progress.attempts !== 1 ? 'zes' : ''}</p>
                              </div>
                            )}
                            {isUnlocked && (
                              <div className="flex gap-1">
                                <Link href={`/learn/${trackId}/${concept.id}`}>
                                  <Button size="sm" variant="outline" className="text-xs h-7 px-2">Study</Button>
                                </Link>
                                <Link href={`/quiz/${concept.id}`}>
                                  <Button size="sm" className="text-xs h-7 px-2">Quiz</Button>
                                </Link>
                              </div>
                            )}
                            {!isUnlocked && (
                              <ChevronRight className="h-4 w-4 text-slate-300" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
