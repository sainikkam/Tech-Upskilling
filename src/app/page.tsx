'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Zap, Brain, RotateCcw, BarChart3, BookOpen, Loader2 } from 'lucide-react'

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const supabase = createClient()

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/dashboard')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex">
      {/* Left: Hero */}
      <div className="flex-1 flex flex-col justify-center px-16 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <span className="text-white font-bold text-lg">AI Engineer Upskilling</span>
        </div>

        <h1 className="text-5xl font-bold text-white leading-tight mb-4">
          Go from zero to<br />
          <span className="text-blue-400">industry-grade</span><br />
          AI engineer.
        </h1>

        <p className="text-slate-300 text-lg mb-10 max-w-md">
          Master DSA, machine learning, LLM systems, and system design through AI-powered quizzes and spaced repetition — focused on <em>conceptual understanding</em>, not syntax.
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-lg">
          {[
            { icon: BookOpen, label: '40+ Concepts', desc: 'Structured curriculum across 4 tracks' },
            { icon: Brain, label: 'Adaptive Quizzes', desc: 'AI-generated questions that match your level' },
            { icon: RotateCcw, label: 'Spaced Repetition', desc: 'Review at the optimal time for retention' },
            { icon: BarChart3, label: 'Weakness Analysis', desc: 'Know exactly what to focus on next' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
              <Icon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-sm font-medium">{label}</p>
                <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Auth form */}
      <div className="w-96 flex items-center justify-center p-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{isSignUp ? 'Create account' : 'Sign in'}</CardTitle>
            <CardDescription>
              {isSignUp ? 'Start your upskilling journey.' : 'Continue your learning.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
              )}
              {message && (
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">{message}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-4">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null) }}
                className="text-blue-600 font-medium hover:underline"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
