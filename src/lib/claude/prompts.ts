// All Claude prompts live here — iterate without redeploying

export const PROMPTS = {
  EXPLAIN_CONCEPT: (conceptTitle: string, conceptDescription: string, keyPoints: string[], difficulty: string) => `
You are an expert computer science and AI educator helping an engineer build deep conceptual understanding (not syntax).

Concept: ${conceptTitle}
Description: ${conceptDescription}
Difficulty: ${difficulty}
Key Points to Cover: ${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Provide a rich explanation following this structure:

## The Core Idea
Explain the fundamental intuition in 2-3 sentences. Use an analogy if it genuinely clarifies.

## Why It Matters
Explain the real-world importance and where this concept appears in production systems.

## How It Works
Walk through the mechanism step by step. Focus on the "why" behind each step, not the code.

## Critical Trade-offs
What are the strengths? What breaks down? When should you NOT use this?

## The Key Insight
The single most important thing to understand — the "aha moment" that makes everything else click.

## Common Misconceptions
2-3 things that learners typically get wrong about this concept.

Keep explanations conceptual and precise. Avoid syntax and language-specific code. Use pseudocode or mathematical notation where helpful.
`.trim(),

  GENERATE_QUIZ: (conceptTitle: string, description: string, keyPoints: string[], masteryScore: number, numQuestions: number) => `
You are generating quiz questions to test deep conceptual understanding of "${conceptTitle}".

Key points to test: ${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Current mastery score: ${masteryScore}/100 (${masteryScore < 40 ? 'beginner — test fundamentals' : masteryScore < 70 ? 'intermediate — test application and trade-offs' : 'advanced — test edge cases and nuanced understanding'})

Generate exactly ${numQuestions} multiple-choice questions. Focus on:
- Conceptual understanding, NOT syntax
- Trade-offs and when to use/not use
- Edge cases and counterintuitive behaviors
- Real-world application of concepts

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Explanation of why this answer is correct and others are wrong",
      "conceptTag": "specific sub-concept being tested"
    }
  ]
}

Rules:
- Each question must have exactly 4 options
- "correct" is the 0-indexed position of the correct answer
- Vary which position (0-3) is correct across questions
- Explanations must be educational and explain the WHY
- No questions about specific syntax or language features
`.trim(),

  QUIZ_FEEDBACK: (conceptTitle: string, score: number, responses: Array<{question: string, correct: boolean, explanation: string}>) => `
A learner just completed a quiz on "${conceptTitle}" and scored ${score}%.

Questions answered:
${responses.map((r, i) => `${i + 1}. ${r.question} — ${r.correct ? '✓ Correct' : '✗ Incorrect'}`).join('\n')}

Provide a brief (3-5 sentence) personalized feedback message that:
1. Acknowledges their performance (be encouraging but honest)
2. Identifies 1-2 specific areas from their wrong answers to focus on
3. Suggests a concrete next step

Keep it conversational and motivating. Be specific about what to study, not generic.
`.trim(),

  ANALYZE_STRENGTHS: (progressData: Array<{concept: string, mastery: number, attempts: number}>) => `
Analyze this learner's progress data and provide insights on their strengths and weaknesses:

${progressData.map(p => `- ${p.concept}: ${p.mastery}% mastery (${p.attempts} attempts)`).join('\n')}

Provide:
1. Top 2-3 strengths (concepts with high mastery)
2. Top 2-3 areas needing improvement
3. One specific study recommendation based on the patterns you see

Be specific and actionable. Keep it under 150 words.
`.trim(),
}
