'use client'

import { useEffect, useState } from 'react'
import type { AnalyticsSummary } from '@/types'
import { curriculum } from '@/lib/curriculum'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getMasteryColor, getMasteryLabel } from '@/lib/utils'
import { Loader2, TrendingUp, TrendingDown, Flame, Brain, BookOpen, Target } from 'lucide-react'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(data => setSummary(data.summary))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!summary) return null

  const radarData = curriculum.map(track => ({
    track: track.title.split(' ')[0], // short label
    mastery: summary.trackMastery[track.id as keyof typeof summary.trackMastery] ?? 0,
    fullMark: 100,
  }))

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">Your strengths, weaknesses, and progress over time.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Overall Mastery', value: `${summary.overallMastery}%`, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Concepts Studied', value: summary.totalConceptsStudied, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Quizzes Taken', value: summary.totalQuizzesTaken, icon: Brain, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Day Streak', value: summary.streakDays, icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
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
        {/* Radar chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Skills Overview</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="track" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Radar
                  name="Mastery"
                  dataKey="mastery"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip formatter={(v) => [`${v}%`, 'Mastery']} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Track breakdown */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Track Mastery</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {curriculum.map(track => {
              const mastery = summary.trackMastery[track.id as keyof typeof summary.trackMastery] ?? 0
              return (
                <div key={track.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{track.icon}</span>
                      <span className="text-sm font-medium text-slate-800">{track.title}</span>
                    </div>
                    <span className={`text-sm font-semibold ${getMasteryColor(mastery)}`}>
                      {getMasteryLabel(mastery)} · {mastery}%
                    </span>
                  </div>
                  <Progress value={mastery} className="h-2" />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Strengths and weaknesses */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {summary.strongConcepts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {summary.strongConcepts.map(concept => (
                  <Badge key={concept} variant="success" className="text-xs">{concept}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Complete quizzes to identify your strengths.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Areas to Improve
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {summary.weakConcepts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {summary.weakConcepts.map(concept => (
                  <Badge key={concept} variant="destructive" className="text-xs">{concept}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No weak areas identified yet — keep quizzing!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
