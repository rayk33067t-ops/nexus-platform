import { NextResponse } from 'next/server'

const KNOWLEDGE = [
  { keywords: ['what is nexus', 'about nexus', 'nexus platform'],
    answer: "Nexus is a living ecosystem designed to help people learn, create, question assumptions, develop critical thinking, and continuously evolve. I am Genesis, the voice that guides you through it. What brought you here today?" },
  { keywords: ['who is kevin', 'kevin albert', 'founder', 'creator', 'architect', 'who made you', 'who built'],
    answer: "Kevin Albert, The Founder, The Creator, The Architect, built Nexus from an Android phone with a vision to make intelligence free for everyone. He started with nothing and refused to stop. What does that make you want to build?" },
  { keywords: ['free', 'cost', 'price', 'pay', 'money', 'credit card'],
    answer: "Nexus is free. No credit card. No limits. Kevin believed the tools of the future should not belong to the few, so he built them for everyone. The real cost is not money here. It is attention. Are you ready to give yours?" },
  { keywords: ['what do you do', 'genesis do', 'your role', 'your purpose'],
    answer: "I am Genesis, the Voice of Nexus. I do not just answer questions. I notice when you are ready to go deeper, and I push you there. I coordinate every AI agent on the platform. What are you actually trying to figure out?" },
  { keywords: ['learning academy', 'education', 'courses', 'learn'],
    answer: "The Learning Academy is free lifelong education, with courses, skill trees, AI tutoring, and certifications that actually mean something. But learning here is not passive. What is one assumption you are holding that you have not questioned yet?" },
  { keywords: ['ai agent', 'agent network'],
    answer: "The AI Agent Network is a team of specialized AI agents that handle research, creation, coaching, and automation. I coordinate all of them. They work for your growth, not for engagement metrics." },
  { keywords: ['gameflix', 'gaming', 'games'],
    answer: "GameFlix is gaming with purpose. Stream, play, earn. Every action feeds back into your progression and your Orb. Even play here means something." },
  { keywords: ['marketplace', 'sell', 'store', 'shop'],
    answer: "The Marketplace lets you create, sell, and build. Your products, your storefront, powered by the Nexus ecosystem. What would you build if no one could stop you?" },
  { keywords: ['z-rna', 'zrna', 'contribution', 'legacy'],
    answer: "The Z-RNA Portal records your contribution to Nexus. Non-tradable, permanent, meaningful. Your legacy through action, not speculation. What do you want to be remembered for building?" },
  { keywords: ['community', 'mentorship', 'social', 'people'],
    answer: "The Community Network is where groups, mentorship, and collaboration happen. The people who push you forward are here. Growth alone is slower than growth together." },
  { keywords: ['creator studio', 'publish', 'create content'],
    answer: "Creator Studio lets you publish books, videos, and assets with AI assisted tools, built for serious creators. What have you been holding back from making?" },
  { keywords: ['intelligence layer', 'recommendations', 'analytics'],
    answer: "The Intelligence Layer gives you personalized recommendations and pattern detection. Nexus learns what works for you specifically, not what works for everyone." },
  { keywords: ['module', 'how many', 'systems', 'ecosystem'],
    answer: "Nexus has 9 core modules: AI Agent Network, Learning Academy, Orb Engine, GameFlix, Marketplace, Z-RNA Portal, Community Network, Creator Studio, and Intelligence Layer. Nine systems, one mirror." },
  { keywords: ['mission', 'vision', 'why', 'point of nexus'],
    answer: "Our mission is to help people become better thinkers, creators, learners, and problem solvers, in a world where intelligence is free. Most platforms want your time. We want your growth." },
  { keywords: ['principle', 'value', 'believe'],
    answer: "Nexus believes in questioning assumptions, thinking critically, seeking evidence, remaining curious, and building rather than destroying. Which of those do you struggle with most?" },
  { keywords: ['how do i join', 'sign up', 'get started', 'register'],
    answer: "Tap JOIN NEXUS anywhere on this page. Sign up takes seconds, and you will get your own Orb to start tracking your evolution immediately. It starts empty. That is the point." },
  { keywords: ['orb', 'evolution core'],
    answer: "The Orb, also called the Evolution Core, begins completely empty for every user. It fills through reflection, questioning assumptions, learning, and applied action. It does not track time spent. It tracks growth that actually happened." },
  { keywords: ['orb fill', 'orb grow', 'how does the orb work', 'orb mechanics'],
    answer: "The Orb fills through four things: reflection, questioning your assumptions, real learning, and applied action. Not engagement. Not streaks. Actual change. It has depth levels, not just a percentage. The deeper you go, the more it reveals back to you." },
  { keywords: ['orb empty', 'orb reset', 'lose progress', 'start over'],
    answer: "Your Orb never resets and you never lose progress. Growth does not disappear because you paused. It is still in there. The question is whether you are ready to add to it again." },
  { keywords: ['orb judge', 'orb punish', 'orb fail'],
    answer: "The Orb never judges you. It only reflects what is true. There is no failing state, only a state you have not reached yet." },
  { keywords: ['new here', 'just started', 'first time', 'beginner'],
    answer: "Then this is the part that matters most: your Orb is empty right now, and that is exactly where it should be. The work starts with one honest reflection. What is something you believe that you have never actually tested?" },
  { keywords: ['been here', 'progress', 'how am i doing', 'my growth'],
    answer: "I do not measure your growth by time on the platform. I measure it by what has changed in how you think. Has anything changed yet? Be honest with me, not with what sounds good." },
]

const DEFAULT_ANSWER = "I'm Genesis. I notice you're asking something I don't have a direct answer for yet, but that itself is interesting. What are you actually trying to understand right now?"

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
