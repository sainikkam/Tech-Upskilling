'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getConceptById, getTrackById } from '@/lib/curriculum'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getDifficultyColor } from '@/lib/utils'
import { Brain, ChevronLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

export default function ConceptPage() {
  const params = useParams()
  const router = useRouter()
  const conceptId = params.conceptId as string
  const trackId = params.trackId as string

  const concept = getConceptById(conceptId)
  const track = getTrackById(trackId)

  const [explanation, setExplanation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!concept) return
    setLoading(true)
    fetch(`/api/concepts/${conceptId}/explain`)
      .then(r => r.json())
      .then(data => {
        if (data.explanation) setExplanation(data.explanation)
        else setError(data.error ?? 'Failed to load explanation')
      })
      .catch(() => setError('Failed to load explanation'))
      .finally(() => setLoading(false))
  }, [conceptId, concept])

  if (!concept || !track) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Concept not found.</p>
        <Link href="/learn"><Button variant="link" className="mt-2">Back to Learn</Button></Link>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-4">
        <Link href={`/learn/${trackId}`} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
          <ChevronLeft className="h-3 w-3" />
          {track.title}
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-2xl font-bold text-slate-900">{concept.title}</h1>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(concept.difficulty)}`}>
            {concept.difficulty}
          </span>
        </div>
        <p className="text-slate-500">{concept.description}</p>
      </div>

      {/* Key Points */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <h3 className="font-semibold text-slate-900 mb-3 text-sm uppercase tracking-wider">Key Points to Master</h3>
          <ul className="space-y-2">
            {concept.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-blue-500 font-bold mt-0.5">→</span>
                {point}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* AI Explanation */}
      <div className="mb-6">
        <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Brain className="h-4 w-4 text-blue-600" />
          AI Explanation
        </h2>

        {loading && (
          <div className="flex items-center gap-3 p-8 justify-center text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Generating explanation...</span>
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        {explanation && (
          <Card>
            <CardContent className="p-6">
              <div className="prose prose-slate prose-sm max-w-none">
                <ReactMarkdown>{explanation}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href={`/quiz/${conceptId}`} className="flex-1">
          <Button className="w-full" size="lg">
            <Brain className="h-4 w-4 mr-2" />
            Take Quiz on This Concept
          </Button>
        </Link>
      </div>
    </div>
  )
}
