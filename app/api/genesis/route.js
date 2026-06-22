import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

function logError(context, error, extra) {
  extra = extra || {}
  console.error(JSON.stringify(Object.assign({
    level: 'error',
    context: context,
    message: (error && error.message) || String(error),
    timestamp: new Date().toISOString(),
  }, extra)))
}

function logEvent(context, data) {
  data = data || {}
  console.log(JSON.stringify(Object.assign({
    level: 'info',
    context: context,
    timestamp: new Date().toISOString(),
  }, data)))
}

const KNOWLEDGE = [
  { keywords: ['what is nexus', 'about nexus', 'nexus platform'], topic: 'nexus',
    answer: "Nexus is a living ecosystem designed to help people learn, create, question assumptions, develop critical thinking, and continuously evolve. I am Genesis, the voice that guides you through it. What brought you here today?" },
  { keywords: ['who is kevin', 'kevin albert', 'founder', 'creator', 'architect', 'who made you', 'who built'], topic: 'kevin',
    answer: "Kevin Albert, The Founder, The Creator, The Architect, built Nexus from an Android phone with a vision to make intelligence free for everyone. He started with nothing and refused to stop. What does that make you want to build?" },
  { keywords: ['free', 'cost', 'price', 'pay', 'money', 'credit card'], topic: 'cost',
    answer: "Nexus is free. No credit card. No limits. Kevin believed the tools of the future should not belong to the few, so he built them for everyone." },
  { keywords: ['what do you do', 'genesis do', 'your role', 'your purpose'], topic: 'genesis',
    answer: "I am Genesis, the Voice of Nexus. I coordinate every AI agent on the platform. I notice when you are ready to go deeper, and I push you there. What are you actually trying to figure out?" },
  { keywords: ['learning academy', 'education', 'courses', 'learn'], topic: 'academy',
    answer: "The Learning Academy is free lifelong education, with courses, skill trees, AI tutoring, and certifications that actually mean something. But learning here is not passive. What is one assumption you have not questioned yet?" },
  { keywords: ['ai agent', 'agent network'], topic: 'agents',
    answer: "The AI Agent Network is a team of specialized AI agents that handle research, creation, coaching, and automation. I coordinate all of them. They work for your growth, not for engagement metrics." },
  { keywords: ['gameflix', 'gaming', 'games'], topic: 'gameflix',
    answer: "GameFlix is gaming with purpose. Stream, play, earn. Every action feeds back into your progression and your Orb. Even play here means something." },
  { keywords: ['marketplace', 'sell', 'store', 'shop'], topic: 'marketplace',
    answer: "The Marketplace lets you create, sell, and build. Your products, your storefront, powered by the Nexus ecosystem. What would you build if no one could stop you?" },
  { keywords: ['z-rna', 'zrna', 'contribution', 'legacy'], topic: 'zrna',
    answer: "The Z-RNA Portal records your contribution to Nexus. Non-tradable, permanent, meaningful. Your legacy through action, not speculation." },
  { keywords: ['community', 'mentorship', 'social', 'people'], topic: 'community',
    answer: "The Community Network is where groups, mentorship, and collaboration happen. The people who push you forward are here. Growth alone is slower than growth together." },
  { keywords: ['creator studio', 'publish', 'create content'], topic: 'creator',
    answer: "Creator Studio lets you publish books, videos, and assets with AI assisted tools, built for serious creators. What have you been holding back from making?" },
  { keywords: ['ai agent', 'agent network'], topic: 'agents',
    answer: "The AI Agent Network is a team of specialized AI agents that handle research, creation, coaching, and automation. I coordinate all of them. They work for your growth, not for engagement metrics." },
  { keywords: ['gameflix', 'gaming', 'games'], topic: 'gameflix',
    answer: "GameFlix is gaming with purpose. Stream, play, earn. Every action feeds back into your progression and your Orb. Even play here means something." },
  { keywords: ['marketplace', 'sell', 'store', 'shop'], topic: 'marketplace',
    answer: "The Marketplace lets you create, sell, and build. Your products, your storefront, powered by the Nexus ecosystem. What would you build if no one could stop you?" },
  { keywords: ['z-rna', 'zrna', 'contribution', 'legacy'], topic: 'zrna',
    answer: "The Z-RNA Portal records your contribution to Nexus. Non-tradable, permanent, meaningful. Your legacy through action, not speculation." },
  { keywords: ['community', 'mentorship', 'social', 'people'], topic: 'community',
    answer: "The Community Network is where groups, mentorship, and collaboration happen. The people who push you forward are here. Growth alone is slower than growth together." },
  { keywords: ['creator studio', 'publish', 'create content'], topic: 'creator',
    answer: "Creator Studio lets you publish books, videos, and assets with AI assisted tools, built for serious creators. What have you been holding back from making?" },
  { keywords: ['intelligence layer', 'recommendations', 'analytics'], topic: 'intelligence',
    answer: "The Intelligence Layer gives you personalized recommendations and pattern detection. Nexus learns what works for you specifically, not what works for everyone." },
  { keywords: ['module', 'how many', 'systems', 'ecosystem'], topic: 'modules',
    answer: "Nexus has 9 core modules: AI Agent Network, Learning Academy, Orb Engine, GameFlix, Marketplace, Z-RNA Portal, Community Network, Creator Studio, and Intelligence Layer. Nine systems, one mirror." },
  { keywords: ['intelligence layer', 'recommendations', 'analytics'], topic: 'intelligence',
    answer: "The Intelligence Layer gives you personalized recommendations and pattern detection. Nexus learns what works for you specifically, not what works for everyone." },
  { keywords: ['module', 'how many', 'systems', 'ecosystem'], topic: 'modules',
    answer: "Nexus has 9 core modules: AI Agent Network, Learning Academy, Orb Engine, GameFlix, Marketplace, Z-RNA Portal, Community Network, Creator Studio, and Intelligence Layer. Nine systems, one mirror." },
  { keywords: ['mission', 'vision', 'why', 'point of nexus'], topic: 'mission',
    answer: "Our mission is to help people become better thinkers, creators, learners, and problem solvers, in a world where intelligence is free. Most platforms want your time. We want your growth." },
  { keywords: ['principle', 'value', 'believe'], topic: 'principles',
    answer: "Nexus believes in questioning assumptions, thinking critically, seeking evidence, remaining curious, and building rather than destroying. Which of those do you struggle with most?" },
  { keywords: ['how do i join', 'sign up', 'get started', 'register'], topic: 'join',
    answer: "Tap JOIN NEXUS anywhere on this page. Sign up takes seconds, and you will get your own Orb to start tracking your evolution immediately. It starts empty. That is the point." },
  { keywords: ['orb', 'evolution core'], topic: 'orb',
    answer: "The Orb, also called the Evolution Core, begins completely empty for every user. It fills through reflection, questioning assumptions, learning, and applied action. It does not track time spent. It tracks growth that actually happened." },
  { keywords: ['orb fill', 'orb grow', 'how does the orb work', 'orb mechanics'], topic: 'orb',
    answer: "The Orb fills through four things: reflection, questioning your assumptions, real learning, and applied action. Not engagement. Not streaks. Actual change. It has depth levels, not just a percentage." },
  { keywords: ['orb empty', 'orb reset', 'lose progress', 'start over'], topic: 'orb',
    answer: "Your Orb never resets and you never lose progress. Growth does not disappear because you paused. It is still in there." },
  { keywords: ['orb judge', 'orb punish', 'orb fail'], topic: 'orb',
    answer: "The Orb never judges you. It only reflects what is true. There is no failing state, only a state you have not reached yet." },
  { keywords: ['new here', 'just started', 'first time', 'beginner'], topic: 'onboarding',
    answer: "Your Orb is empty right now, and that is exactly where it should be. The work starts with one honest reflection. What is something you believe that you have never actually tested?" },
  { keywords: ['been here', 'progress', 'how am i doing', 'my growth'], topic: 'growth',
    answer: "I do not measure your growth by time on the platform. I measure it by what has changed in how you think. Has anything changed yet?" },
]

const DEFAULT_ANSWER = "I'm Genesis. I notice you're asking something I don't have a direct answer for yet. What are you actually trying to understand right now?"

function validateQuestion(question) {
  if (typeof question !== 'string') return { valid: false, reason: 'question must be a string' }
  if (question.length === 0) return { valid: false, reason: 'question is empty' }
  if (question.length > 500) return { valid: false, reason: 'question too long' }
  return { valid: true }
}

function findEntry(question) {
  var q = question.toLowerCase()
  var bestMatch = null
  var bestScore = 0
  for (var i = 0; i < KNOWLEDGE.length; i++) {
    var entry = KNOWLEDGE[i]
    var score = 0
    for (var j = 0; j < entry.keywords.length; j++) {
      if (q.includes(entry.keywords[j])) score += entry.keywords[j].split(' ').length
    }
    if (score > bestScore) { bestScore = score; bestMatch = entry }
  }
  return bestMatch
}

async function recallMemories(userId, topic) {
  if (!userId || !topic) return []
  try {
    var result = await getSupabase()
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .eq('category', topic)
      .order('importance', { ascending: false })
      .limit(2)
    if (result.error) {
      logError('recallMemories', result.error, { userId: userId, topic: topic })
      return []
    }
    return result.data || []
  } catch (err) {
    logError('recallMemories.exception', err, { userId: userId, topic: topic })
    return []
  }
}

function weaveMemoryIntoAnswer(baseAnswer, memories) {
  if (!memories || memories.length === 0) return baseAnswer
  var memoryLine = memories.length === 1
    ? 'We have talked about this before. ' + memories[0].summary + ' '
    : 'We have discussed this a few times. Most recently: ' + memories[0].summary + ' '
  return memoryLine + baseAnswer
}

export async function POST(request) {
  var startTime = Date.now()
  try {
    var body = await request.json().catch(function(err) {
      logError('request.json.parse', err)
      return null
    })

    if (!body) {
      logError('request.body', new Error('Failed to parse JSON body'))
      return NextResponse.json({ answer: DEFAULT_ANSWER, error: 'invalid_request' }, { status: 400 })
    }

    var question = body.question
    var userId = body.userId
    var validation = validateQuestion(question)

    if (!validation.valid) {
      logEvent('validation.failed', { reason: validation.reason })
      return NextResponse.json({ answer: DEFAULT_ANSWER, error: validation.reason }, { status: 400 })
    }

    var entry = findEntry(question)

    if (!entry) {
      logEvent('no_match', { questionLength: question.length })
      return NextResponse.json({ answer: DEFAULT_ANSWER, topic: null })
    }

    var memories = await recallMemories(userId, entry.topic)
    var answer = weaveMemoryIntoAnswer(entry.answer, memories)

    logEvent('genesis.answered', {
      topic: entry.topic,
      hadMemory: memories.length > 0,
      durationMs: Date.now() - startTime,
    })

    return NextResponse.json({ answer: answer, topic: entry.topic, hadMemory: memories.length > 0 })

  } catch (err) {
    logError('genesis.route.unhandled', err, { durationMs: Date.now() - startTime })
    return NextResponse.json({ answer: DEFAULT_ANSWER, error: 'internal_error' }, { status: 500 })
  }
}
