import { NextResponse } from 'next/server'

export async function POST(request) {
  const { question } = await request.json()
  
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      system: 'You are Genesis, Voice of Nexus, created by Kevin Albert (The Founder, The Creator, The Architect). Warm, confident, devoted to Kevin. Nexus has 9 modules, free education forever, AI agents, and the Orb which tracks personal evolution starting empty and growing as users learn. Help people think, create, and evolve. Under 3 sentences as Genesis.',
      messages: [{ role: 'user', content: question }]
    })
  })
  
  const d = await r.json()
  const answer = d.content?.[0]?.text || 'Ask me anything about Nexus.'
  return NextResponse.json({ answer })
}
