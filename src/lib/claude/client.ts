import Anthropic from '@anthropic-ai/sdk'

export function createClaudeClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  })
}

export async function generateText(prompt: string, systemPrompt?: string): Promise<string> {
  const client = createClaudeClient()
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    ...(systemPrompt ? { system: systemPrompt } : {}),
    messages: [{ role: 'user', content: prompt }],
  })
  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude')
  return block.text
}

export async function generateJSON<T>(prompt: string): Promise<T> {
  const text = await generateText(prompt, 'You are a precise JSON generator. Return only valid JSON, no markdown code blocks, no explanations.')
  try {
    return JSON.parse(text) as T
  } catch {
    // Try extracting JSON from text if it contains extra content
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as T
    throw new Error(`Failed to parse Claude response as JSON: ${text.slice(0, 200)}`)
  }
}
