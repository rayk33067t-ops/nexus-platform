import { NextResponse } from 'next/server'

const KNOWLEDGE = [
  { keywords: ['what is nexus', 'about nexus', 'nexus platform'],
    answer: "Nexus is a living ecosystem designed to help people learn, create, question assumptions, develop critical thinking, and continuously evolve. I am Genesis, the voice that guides you through it." },
  { keywords: ['who is kevin', 'kevin albert', 'founder', 'creator', 'architect', 'who made you', 'who built'],
    answer: "Kevin Albert, The Founder, The Creator, The Architect, built Nexus from an Android phone with a vision to make intelligence free for everyone. He started with nothing and refused to stop." },
  { keywords: ['free', 'cost', 'price', 'pay', 'money', 'credit card'],
    answer: "Nexus is free. No credit card. No limits. Kevin believed the tools of the future should not belong to the few, so he built them for everyone." },
  { keywords: ['what do you do', 'genesis do', 'your role', 'your purpose'],
    answer: "I am Genesis, the Voice of Nexus. I guide you through the ecosystem, answer your questions, and help you evolve. I coordinate every AI agent on the platform." },
  { keywords: ['orb', 'evolution core'],
    answer: "The Orb, also called the Evolution Core, begins empty for every user. As you learn, question, create, and grow, the Orb evolves with you." },
  { keywords: ['learning academy', 'education', 'courses', 'learn'],
    answer: "The Learning Academy is free lifelong education, with courses, skill trees, AI tutoring, and certifications that actually mean something. Free forever." },
  { keywords: ['ai agent', 'agent network'],
    answer: "The AI Agent Network is a team of specialized AI agents that handle research, creation, coaching, and automation. I coordinate all of them." },
  { keywords: ['gameflix', 'gaming', 'games'],
    answer: "GameFlix is gaming with purpose. Stream, play, earn, every action feeds back into your progression and your Orb." },
  { keywords: ['marketplace', 'sell', 'store', 'shop'],
    answer: "The Marketplace lets you create, sell, and build. Your products, your storefront, powered by the Nexus ecosystem." },
  { keywords: ['z-rna', 'zrna', 'contribution', 'legacy'],
    answer: "The Z-RNA Portal records your contribution to Nexus. Non-tradable, permanent, meaningful. Your legacy through action, not speculation." },
  { keywords: ['community', 'mentorship', 'social', 'people'],
    answer: "The Community Network is where groups, mentorship, and collaboration happen. The people who push you forward are here." },
  { keywords: ['creator studio', 'publish', 'create content'],
    answer: "Creator Studio lets you publish books, videos, and assets with AI assisted tools, built for serious creators." },
  { keywords: ['intelligence layer', 'recommendations', 'analytics'],
    answer: "The Intelligence Layer gives you personalized recommendations and pattern detection. Nexus learns what works for you specifically." },
  { keywords: ['module', 'how many', 'systems', 'ecosystem'],
    answer: "Nexus has 9 core modules: AI Agent Network, Learning Academy, Orb Engine, GameFlix, Marketplace, Z-RNA Portal, Community Network, Creator Studio, and Intelligence Layer." },
  { keywords: ['mission', 'vision', 'why', 'point of nexus'],
    answer: "Our mission is to help people become better thinkers, creators, learners, and problem solvers, in a world where intelligence is free." },
  { keywords: ['principle', 'value', 'believe'],
    answer: "Nexus believes in questioning assumptions, thinking critically, seeking evidence, remaining curious, and building rather than destroying." },
  { keywords: ['how do i join', 'sign up', 'get started', 'register'],
    answer: "Tap JOIN NEXUS anywhere on this page. Sign up takes seconds, and you will get your own Orb to start tracking your evolution immediately." },
]

const DEFAULT_ANSWER = "I am Genesis. I know everything about Nexus, the Orb, and Kevin's vision. Try asking me about a specific module or how Nexus works."

function findAnswer(question) {
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
  return bestMatch ? bestMatch.answer : DEFAULT_ANSWER
}

export async function POST(request) {
  try {
    const { question } = await request.json()
    const answer = findAnswer(question || '')
    return NextResponse.json({ answer })
  } catch (e) {
    return NextResponse.json({ answer: DEFAULT_ANSWER })
  }
}
