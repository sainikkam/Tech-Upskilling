import { curriculum } from '@/lib/curriculum'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getDifficultyColor } from '@/lib/utils'
import Link from 'next/link'
import { Brain } from 'lucide-react'

export default function QuizIndexPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Quiz</h1>
        <p className="text-slate-500 mt-1">Select a concept to be quizzed on. Questions are AI-generated and adapt to your mastery level.</p>
      </div>

      <div className="space-y-8">
        {curriculum.map(track => (
          <div key={track.id}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">{track.icon}</span>
              <h2 className="font-semibold text-slate-900">{track.title}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {track.topics.flatMap(topic =>
                topic.concepts.map(concept => (
                  <Link key={concept.id} href={`/quiz/${concept.id}`}>
                    <Card className="hover:shadow-sm cursor-pointer transition-shadow h-full">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{concept.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{concept.description}</p>
                          </div>
                          <Brain className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        </div>
                        <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full font-medium mt-2 ${getDifficultyColor(concept.difficulty)}`}>
                          {concept.difficulty}
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
