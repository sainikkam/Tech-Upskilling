'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getConceptById } from '@/lib/curriculum'
import type { QuizQuestion, QuizResult } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn, getDifficultyColor } from '@/lib/utils'
import { Loader2, CheckCircle2, XCircle, ChevronRight, RotateCcw, BookOpen, BarChart3 } from 'lucide-react'
import Link from 'next/link'

type Phase = 'loading' | 'quiz' | 'reviewing' | 'results' | 'error'

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const conceptId = params.conceptId as string
  const concept = getConceptById(conceptId)

  const [phase, setPhase] = useState<Phase>('loading')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [userAnswers, setUserAnswers] = useState<number[]>([])
  const [result, setResult] = useState<QuizResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!concept) return
    fetch('/api/quiz/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conceptId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.questions) {
          setQuestions(data.questions)
          setSessionId(data.sessionId)
          setPhase('quiz')
        } else {
          setError(data.error ?? 'Failed to generate quiz')
          setPhase('error')
        }
      })
      .catch(() => {
        setError('Failed to generate quiz')
        setPhase('error')
      })
  }, [conceptId, concept])

  const currentQuestion = questions[currentIdx]
  const isLastQuestion = currentIdx === questions.length - 1

  function handleSelect(optionIdx: number) {
    if (selected !== null) return // already answered
    setSelected(optionIdx)
  }

  function handleNext() {
    if (selected === null) return
    const newAnswers = [...userAnswers, selected]
    setUserAnswers(newAnswers)
    setSelected(null)

    if (isLastQuestion) {
      submitQuiz(newAnswers)
    } else {
      setCurrentIdx(i => i + 1)
    }
  }

  const submitQuiz = useCallback(async (answers: number[]) => {
    setPhase('reviewing')
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, conceptId, questions, userAnswers: answers }),
      })
      const data = await res.json()
      if (data.result) {
        setResult(data.result)
        setPhase('results')
      } else {
        setError(data.error ?? 'Failed to submit quiz')
        setPhase('error')
      }
    } catch {
      setError('Failed to submit quiz')
      setPhase('error')
    }
  }, [sessionId, conceptId, questions])

  if (!concept) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Concept not found.</p>
        <Link href="/quiz"><Button variant="link">Back to Quiz</Button></Link>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-2">
        <Link href="/quiz" className="text-sm text-slate-500 hover:text-slate-700">← Quiz Selection</Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{concept.title}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDifficultyColor(concept.difficulty)}`}>
            {concept.difficulty}
          </span>
        </div>
      </div>

      {/* Loading */}
      {phase === 'loading' && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm">Generating personalized quiz...</p>
        </div>
      )}

      {/* Reviewing */}
      {phase === 'reviewing' && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm">Calculating results...</p>
        </div>
      )}

      {/* Error */}
      {phase === 'error' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={() => router.back()} variant="outline">Go Back</Button>
          </CardContent>
        </Card>
      )}

      {/* Quiz */}
      {phase === 'quiz' && currentQuestion && (
        <div>
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Question {currentIdx + 1} of {questions.length}</span>
              <span>{Math.round((currentIdx / questions.length) * 100)}%</span>
            </div>
            <Progress value={(currentIdx / questions.length) * 100} className="h-1.5" />
          </div>

          <Card className="mb-4">
            <CardContent className="p-6">
              <p className="text-base font-medium text-slate-900 leading-relaxed mb-6">
                {currentQuestion.question}
              </p>

              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selected === idx
                  const isCorrect = idx === currentQuestion.correct
                  const showCorrect = selected !== null && isCorrect
                  const showWrong = selected !== null && isSelected && !isCorrect

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      disabled={selected !== null}
                      className={cn(
                        'w-full text-left p-3.5 rounded-lg border text-sm transition-all',
                        selected === null && 'hover:border-blue-300 hover:bg-blue-50 border-slate-200',
                        isSelected && selected !== null && !showWrong && 'border-blue-400 bg-blue-50',
                        showCorrect && 'border-green-400 bg-green-50',
                        showWrong && 'border-red-400 bg-red-50',
                        selected !== null && !isSelected && !showCorrect && 'opacity-50 border-slate-200'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold',
                          showCorrect ? 'border-green-400 text-green-600 bg-green-100' :
                          showWrong ? 'border-red-400 text-red-600 bg-red-100' :
                          isSelected ? 'border-blue-400 text-blue-600 bg-blue-100' :
                          'border-slate-300 text-slate-500'
                        )}>
                          {showCorrect ? '✓' : showWrong ? '✗' : String.fromCharCode(65 + idx)}
                        </span>
                        <span className={cn(
                          showCorrect ? 'text-green-800' :
                          showWrong ? 'text-red-800' :
                          'text-slate-700'
                        )}>
                          {option}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Explanation */}
              {selected !== null && (
                <div className={cn(
                  'mt-4 p-4 rounded-lg text-sm',
                  selected === currentQuestion.correct ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'
                )}>
                  <div className="flex items-center gap-2 mb-1 font-medium">
                    {selected === currentQuestion.correct ? (
                      <><CheckCircle2 className="h-4 w-4" /> Correct!</>
                    ) : (
                      <><XCircle className="h-4 w-4" /> Incorrect</>
                    )}
                  </div>
                  {currentQuestion.explanation}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            onClick={handleNext}
            disabled={selected === null}
            className="w-full"
            size="lg"
          >
            {isLastQuestion ? 'See Results' : 'Next Question'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Results */}
      {phase === 'results' && result && (
        <div>
          {/* Score card */}
          <Card className={cn(
            'mb-6 border-2',
            result.score >= 80 ? 'border-green-300 bg-green-50' :
            result.score >= 60 ? 'border-yellow-300 bg-yellow-50' :
            'border-red-300 bg-red-50'
          )}>
            <CardContent className="p-6 text-center">
              <div className={cn(
                'text-5xl font-bold mb-2',
                result.score >= 80 ? 'text-green-700' :
                result.score >= 60 ? 'text-yellow-700' :
                'text-red-700'
              )}>
                {result.score}%
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">
                {result.correctAnswers} / {result.totalQuestions} correct
              </p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-xs text-slate-500">New mastery:</span>
                <Badge variant={result.newMasteryScore >= 70 ? 'success' : result.newMasteryScore >= 50 ? 'warning' : 'destructive'}>
                  {result.newMasteryScore}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Feedback */}
          {result.feedback && (
            <Card className="mb-6">
              <CardContent className="p-5 text-sm text-slate-700 leading-relaxed">
                {result.feedback}
              </CardContent>
            </Card>
          )}

          {/* Answer review */}
          <div className="mb-6 space-y-3">
            <h3 className="font-semibold text-slate-900 text-sm">Answer Review</h3>
            {result.responses.map((resp, i) => (
              <Card key={i} className={resp.isCorrect ? 'border-green-200' : 'border-red-200'}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    {resp.isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-800">{resp.question}</p>
                      {!resp.isCorrect && (
                        <p className="text-xs text-slate-500 mt-1 bg-slate-50 rounded p-2">{resp.explanation}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-3">
            <Link href={`/quiz/${conceptId}`}>
              <Button variant="outline" className="w-full" size="sm">
                <RotateCcw className="h-3 w-3 mr-1" />
                Retake
              </Button>
            </Link>
            <Link href={`/learn/${concept.trackId}/${conceptId}`}>
              <Button variant="outline" className="w-full" size="sm">
                <BookOpen className="h-3 w-3 mr-1" />
                Review
              </Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline" className="w-full" size="sm">
                <BarChart3 className="h-3 w-3 mr-1" />
                Analytics
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
