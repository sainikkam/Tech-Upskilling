export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type Track = 'dsa' | 'ml' | 'ai-engineering' | 'system-design'

export interface Concept {
  id: string
  topicId: string
  trackId: Track
  title: string
  description: string
  difficulty: Difficulty
  order: number
  keyPoints: string[]
  prerequisites?: string[]
}

export interface Topic {
  id: string
  trackId: Track
  title: string
  description: string
  order: number
  concepts: Concept[]
}

export interface TrackData {
  id: Track
  title: string
  description: string
  icon: string
  color: string
  bgColor: string
  topics: Topic[]
}

export interface ConceptProgress {
  conceptId: string
  masteryScore: number // 0–100
  attempts: number
  lastAttemptedAt: string | null
  nextReviewAt: string | null
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct: number // 0-indexed
  explanation: string
  conceptTag: string
}

export interface QuizSession {
  id: string
  conceptId: string
  questions: QuizQuestion[]
  startedAt: string
}

export interface QuizResult {
  sessionId: string
  conceptId: string
  score: number // 0–100
  totalQuestions: number
  correctAnswers: number
  responses: QuizResponse[]
  newMasteryScore: number
  feedback: string
}

export interface QuizResponse {
  questionId: string
  question: string
  userAnswer: number
  correctAnswer: number
  isCorrect: boolean
  explanation: string
}

export interface AnalyticsSummary {
  overallMastery: number
  trackMastery: Record<Track, number>
  strongConcepts: string[]
  weakConcepts: string[]
  reviewDue: number
  totalConceptsStudied: number
  totalQuizzesTaken: number
  streakDays: number
}

export interface ReviewItem {
  concept: Concept
  progress: ConceptProgress
  urgency: 'overdue' | 'due-today' | 'upcoming'
}
