import { GoogleGenerativeAI } from '@google/generative-ai'

const MODEL = 'gemini-2.0-flash'

function getClient() {
  return new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)
}

export async function generateText(prompt: string, systemPrompt?: string): Promise<string> {
  const genAI = getClient()
  const model = genAI.getGenerativeModel({
    model: MODEL,
    ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
  })
  const result = await model.generateContent(prompt)
  return result.response.text()
}

export async function generateJSON<T>(prompt: string): Promise<T> {
  const text = await generateText(
    prompt,
    'You are a precise JSON generator. Return only valid JSON, no markdown code blocks, no explanations.'
  )
  const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as T
    throw new Error(`Failed to parse Gemini response as JSON: ${cleaned.slice(0, 200)}`)
  }
}
