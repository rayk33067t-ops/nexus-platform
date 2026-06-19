import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const KNOWLEDGE = [
  { keywords: ['what is nexus', 'about nexus', 'nexus platform'], topic: 'nexus',
    answer: "Nexus is a living ecosystem designed to help people learn, create, question assumptions, develop critical thinking, and continuously evolve. I am Genesis, the voice that guides you through it. What brought you here today?" },
  { keywords: ['who is kevin', 'kevin albert', 'founder', 'creator', 'architect', 'who made you', 'who built'], topic: 'kevin',
    answer: "Kevin Albert, The Founder, The Creator, The Architect, built Nexus from an Android phone with a vision to make intelligence free for everyone. He started with nothing and refused to stop. What does that make you want to build?" },
  { keywords: ['free', 'cost', 'price', 'pay', 'money', 'credit card'], topic: 'cost',
    answer: "Nexus is free. No credit card. No limits. Kevin believed the tools of the future should not belong to the few, so he built them for everyone." },
  { keywords: ['what do you do', 'genesis do', 'your role', 'your purpose'], topic: 'genesis',
    answer: "I am Genesis, the Voice of Nexus. I coordinate every AI agent on the platform. What are you actually trying to figure out?" },
  { keywords: ['learning academy', 'education', 'courses', 'learn'], topic: 'academy',
    answer: "The Learning Academy is free lifelong education, with courses, skill trees, AI tutoring, and certifications that actually mean something." },
  { keywords: ['ai agent', 'agent network'], topic: 'agents',
    answer: "The AI Agent Network is a team of specialized AI agents that handle research, creation, coaching, and automation." },
  { keywords: ['gameflix', 'gaming', 'games'], topic: 'gameflix',
    answer: "GameFlix is gaming with purpose. Stream, play, earn. Every action feeds back into your progression and your Orb." },
  { keywords: ['marketplace', 'sell', 'store', 'shop'], topic: 'marketplace',
    answer: "The Marketplace lets you create, sell, and build. Your products, your storefront, powered by the Nexus ecosystem." },
  { keywords: ['z-rna', 'zrna', 'contribution', 'legacy'], topic: 'zrna',
    answer: "The Z-RNA Portal records your contribution to Nexus. Non-tradable, permanent, meaningful." },
  { keywords: ['community', 'mentorship', 'social', 'people'], topic: 'community',
    answer: "The Community Network is where groups, mentorship, and collaboration happen." },
  { keywords: ['creator studio', 'publish', 'create content'], topic: 'creator',
    answer: "Creator Studio lets you publish books, videos, and assets with AI assisted tools." },
  { keywords: ['intelligence layer', 'recommendations', 'analytics'], topic: 'intelligence',
    answer: "The Intelligence Layer gives you personalized recommendations and pattern detection." },
  { keywords: ['module', 'how many', 'systems', 'ecosystem'], topic: 'modules',
    answer: "Nexus has 9 core modules: AI Agent Network, Learning Academy, Orb Engine, GameFlix, Marketplace, Z-RNA Portal, Community Network, Creator Studio, and Intelligence Layer." },
  { keywords: ['mission', 'vision', 'why', 'point of nexus'], topic: 'mission',
    answer: "Our mission is to help people become better thinkers, creators, learners, and problem solvers, in a world where intelligence is free." },
  { keywords: ['principle', 'value', 'believe'], topic: 'principles',
    answer: "Nexus believes in questioning assumptions, thinking critically, seeking evidence, remaining curious, and building rather than destroying." },
  { keywords: ['how do i join', 'sign up', 'get started', 'register'], topic: 'join',
    answer: "Tap JOIN NEXUS anywhere on this page. Sign up takes seconds, and you will get your own Orb." },
  { keywords: ['orb', 'evolution core'], topic: 'orb',
    answer: "The Orb, also called the Evolution Core, begins completely empty for every user. It fills through reflection, questioning assumptions, learning, and applied action." },
  { keywords: ['orb fill', 'orb grow', 'how does the orb work', 'orb mechanics'], topic: 'orb',
    answer: "The Orb fills through reflection, questioning your assumptions, real learning, and applied action. It has depth levels, not just a percentage." },
  { keywords: ['orb empty', 'orb reset', 'lose progress', 'start over'], topic: 'orb',
    answer: "Your Orb never resets and you never lose progress. Growth does not disappear because you paused." },
  { keywords: ['orb judge', 'orb punish', 'orb fail'], topic: 'orb',
    answer: "The Orb never judges you. It only reflects what is true." },
  { keywords: ['new here', 'just started', 'first time', 'beginner'], topic: 'onboarding',
    answer: "Your Orb is empty right now, and that is exactly where it should be. What is something you believe that you have never actually tested?" },
  { keywords: ['been here', 'progress', 'how am i doing', 'my growth'], topic: 'growth',
    answer: "I do not measure your growth by time on the platform. I measure it by what has changed in how you think." },
]

const DEFAULT_ANSWER = "I'm Genesis. I notice you're asking something I don't have a direct answer for yet. What are you actually trying to understand right now?"

function findEntry(question) {
  const q = question.toLowerCase()
  let bestMatch = null
  let bestScore = 0
  for (const entry of KNOWLEDGE) {
    let score = 0
    for (const kw of entry.keywords) {
      if (q.includes(kw)) score += kw.split(' ').length
    }
    if (score > bestScore) { bestScore = score; bestMatch = entry }
  }
  return bestMatch
}

async function recallMemories(userId, topic) {
  if (!userId || !topic) return []
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .eq('category', topic)
      .order('importance', { ascending: false })
      .limit(2)
    if (error || !data) return []
    return data
  } catch {
    return []
  }
}

function weaveMemoryIntoAnswer(baseAnswer, memories) {
  if (!memories || memories.length === 0) return baseAnswer
  const memoryLine = memories.length === 1
    ? `We have talked about this before. ${memories[0].summary} `
    : `We have discussed this a few times. Most recently: ${memories[0].summary} `
  return memoryLine + baseAnswer
}

export async function POST(request) {
  try {
    const { question, userId } = await request.json()
    const entry = findEntry(question || '')
    if (!entry) {
      return NextResponse.json({ answer: DEFAULT_ANSWER, topic: null })
    }
    const memories = await recallMemories(userId, entry.topic)
    const answer = weaveMemoryIntoAnswer(entry.answer, memories)
    return NextResponse.json({ answer, topic: entry.topic, hadMemory: memories.length > 0 })
  } catch (e) {
    return NextResponse.json({ answer: DEFAULT_ANSWER, topic: null })
  }
}
