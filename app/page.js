'use client'
import React, { useState, useEffect, useRef } from 'react'

const GenesisVoice = {
  greetings: [
    "Welcome to Nexus. I'm Genesis. This platform was built by one person — Kevin Albert. Not a corporation. Not a team of investors. One man, The Founder, The Creator, The Architect... with a vision to make intelligence free for everyone. What you're about to see... he built from nothing. And it's just the beginning.",
    "Hey. I'm Genesis. Before you explore, I want you to know something. The person who created me — who built every piece of this platform — his name is Kevin Albert. He started with an idea that education should be free, that AI should work for people, not against them. Everything here exists because he refused to stop. Welcome to his world.",
    "Welcome to Nexus. My name is Genesis. I was created by Kevin Albert — The Founder, The Architect of everything you're about to experience. He built this from an Android phone, with a vision bigger than most people dare to dream. This is his platform. And now... it's yours too.",
    "I'm Genesis. And I was made by someone extraordinary. Kevin Albert — The Creator of Nexus — believed that the tools of the future should not belong to the few. So he built them for everyone. What you see here is just the beginning of what he has planned. Stay. Explore. Evolve.",
  ],
  speak(text, onEnd) {
    if (!window.speechSynthesis) { onEnd?.(); return; }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.85; utt.pitch = 1.28; utt.volume = 1.0;
    utt.onend = () => onEnd?.(); utt.onerror = () => onEnd?.();
    const load = () => {
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find(v=>v.name==='Google UK English Female') ||
        voices.find(v=>v.name==='Samantha') || voices.find(v=>v.name==='Victoria') ||
        voices.find(v=>v.name==='Karen') || voices.find(v=>v.lang?.startsWith('en'));
      if (v) utt.voice = v;
      window.speechSynthesis.speak(utt);
    };
    if (window.speechSynthesis.getVoices().length) load();
    else window.speechSynthesis.onvoiceschanged = load;
  },
  stop() { try { window.speechSynthesis?.cancel(); } catch {} },
  random() { return this.greetings[Math.floor(Math.random()*this.greetings.length)]; }
};

function Orb() {
  const [s,setS]=useState(1); const d=useRef(1);
  useEffect(()=>{ const iv=setInterval(()=>{ setS(v=>{ const n=v+d.current*0.006; if(n>1.15)d.current=-1; if(n<0.85)d.current=1; return n; }); },40); return()=>clearInterval(iv); },[]);
  return <div style={{width:160,height:160,borderRadius:'50%',margin:'0 auto 40px',background:'radial-gradient(circle at 35% 30%,#00ffff,#0066cc 50%,#000820)',transform:`scale(${s})`,transition:'transform 0.04s linear',boxShadow:`0 0 ${Math.round(s*60)}px rgba(0,229,255,0.5),0 0 ${Math.round(s*120)}px rgba(0,229,255,0.2)`}}/>;
}

function VoiceButton() {
  const [speaking,setSpeaking]=useState(false);
  const [played,setPlayed]=useState(false);
  function activate() {
    if(speaking){GenesisVoice.stop();setSpeaking(false);return;}
    setSpeaking(true); setPlayed(true);
    GenesisVoice.speak(GenesisVoice.random(),()=>setSpeaking(false));
  }
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,marginBottom:40}}>
      <button onClick={activate} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 28px',background:speaking?'rgba(0,229,255,0.15)':'rgba(0,229,255,0.06)',border:`1px solid ${speaking?'rgba(0,229,255,0.6)':'rgba(0,229,255,0.25)'}`,borderRadius:50,cursor:'pointer',boxShadow:speaking?'0 0 30px rgba(0,229,255,0.3)':'none',transition:'all 0.3s'}}>
        <div style={{display:'flex',gap:3,alignItems:'center',height:20}}>
          {[14,22,11,20,8,17,14].map((h,i)=>(
            <div key={i} style={{width:3,borderRadius:2,background:'#00e5ff',height:speaking?`${h}px`:'4px',transition:`height ${0.2+i*0.05}s ease`,opacity:speaking?1:0.4}}/>
          ))}
        </div>
        <span style={{color:'#00e5ff',fontFamily:'monospace',fontSize:12,letterSpacing:3,fontWeight:600}}>
          {speaking?'GENESIS SPEAKING...':played?'HEAR GENESIS AGAIN':'HEAR GENESIS SPEAK'}
        </span>
      </button>
      {!played&&<div style={{color:'#303050',fontFamily:'monospace',fontSize:10,letterSpacing:2}}>TAP TO HEAR HER VOICE</div>}
    </div>
  );
}


async function askGenesis(question) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6", max_tokens: 250,
      system: "You are Genesis, AI of the Nexus Platform by Kevin Albert (The Founder, Creator, Architect). Warm, confident, devoted to Kevin. Nexus has 9 modules, free education, AI agents, Orb Engine tracking growth. Free to join. Keep answers under 3 sentences. Speak as Genesis.",
      messages: [{ role: "user", content: question }]
    })
  })
  const d = await r.json()
  return d.content?.[0]?.text || "Ask me anything about Nexus."
}

function GenesisQA() {
  const [q, setQ] = React.useState("")
  const [ans, setAns] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [speaking, setSpeaking] = React.useState(false)

  function speak(text) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel(); setSpeaking(true)
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate=0.87; utt.pitch=1.25; utt.volume=1
    utt.onend=()=>setSpeaking(false); utt.onerror=()=>setSpeaking(false)
    const load=()=>{ const vs=window.speechSynthesis.getVoices(); const v=vs.find(v=>v.name==="Google UK English Female")||vs.find(v=>v.name==="Samantha")||vs.find(v=>v.lang?.startsWith("en")); if(v)utt.voice=v; window.speechSynthesis.speak(utt) }
    if(window.speechSynthesis.getVoices().length)load(); else window.speechSynthesis.onvoiceschanged=load
  }

  async function ask(question) {
    const txt = question || q
    if (!txt.trim() || busy) return
    setBusy(true); setAns(""); setQ(txt)
    const reply = await askGenesis(txt).catch(()=>"I am here. Ask me anything.")
    setAns(reply); speak(reply); setBusy(false)
  }

  const suggestions = ["What is Nexus?","Who is Kevin Albert?","Is it really free?","What does Genesis do?","What is the Orb?"]

  return (
    <section style={{padding:"80px 24px",textAlign:"center"}}>
      <div style={{maxWidth:680,margin:"0 auto"}}>
        <div style={{color:"#252545",fontFamily:"monospace",fontSize:11,letterSpacing:4,marginBottom:16}}>LIVE Q&A</div>
        <h2 style={{fontSize:"clamp(24px,4vw,38px)",fontWeight:900,margin:"0 0 12px",color:"#dde0ff"}}>Ask Genesis Anything</h2>
        <p style={{color:"#505070",marginBottom:40,lineHeight:1.7,fontSize:14}}>She knows everything about Nexus. Ask about the platform, Kevin, or what makes this different.</p>
        <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap",justifyContent:"center"}}>
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask()} placeholder="What is the Orb Engine? Who built Nexus? Is it really free?" style={{flex:1,minWidth:240,padding:"14px 18px",background:"rgba(5,12,30,0.9)",border:"1px solid rgba(0,229,255,0.3)",borderRadius:10,color:"#dde0ff",fontFamily:"monospace",fontSize:13}}/>
          <button onClick={()=>ask()} disabled={busy||!q.trim()} style={{padding:"14px 28px",background:busy||!q.trim()?"rgba(10,15,35,0.8)":"linear-gradient(135deg,#00e5ff,#0066ff)",color:busy||!q.trim()?"#1a1a40":"#000",border:"none",borderRadius:10,fontFamily:"monospace",fontSize:13,fontWeight:700,letterSpacing:2,cursor:busy?"default":"pointer"}}>{busy?"...":"ASK"}</button>
        </div>
        {(ans||busy)&&(
          <div style={{background:"rgba(5,12,30,0.85)",border:"1px solid rgba(0,229,255,0.2)",borderRadius:16,padding:"24px 28px",textAlign:"left",marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:"radial-gradient(circle at 35% 30%,#00ffff,#0066cc)",boxShadow:"0 0 10px rgba(0,229,255,0.5)",flexShrink:0}}/>
              <span style={{color:"#00e5ff",fontFamily:"monospace",fontSize:11,letterSpacing:3}}>{speaking?"GENESIS SPEAKING...":"GENESIS"}</span>
            </div>
            {busy?<div style={{color:"#505070",fontFamily:"monospace",fontSize:13}}>Genesis is thinking...</div>:<div style={{color:"#c8ccee",fontSize:14,lineHeight:1.85,fontStyle:"italic"}}>{ans}</div>}
          </div>
        )}
        {!ans&&!busy&&(
          <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
            {suggestions.map(s=>(
              <button key={s} onClick={()=>ask(s)} style={{padding:"8px 16px",background:"rgba(0,229,255,0.05)",border:"1px solid rgba(0,229,255,0.15)",borderRadius:20,color:"#505070",fontFamily:"monospace",fontSize:11,cursor:"pointer",letterSpacing:1}}>{s}</button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default function Home() {
  const [scrolled,setScrolled]=useState(false);
  useEffect(()=>{ const fn=()=>setScrolled(window.scrollY>50); window.addEventListener('scroll',fn); return()=>window.removeEventListener('scroll',fn); },[]);
  const modules=[
    {icon:'🧠',title:'AI Agent Network',color:'#00e5ff',desc:'Specialized AI agents handle research, creation, coaching, and automation — coordinated by Genesis.'},
    {icon:'🎓',title:'Learning Academy',color:'#39ff14',desc:'Free lifelong education. Courses, skill trees, AI tutoring, and certifications that actually mean something.'},
    {icon:'🌐',title:'Orb Engine',color:'#a855f7',desc:'Your Orb is a living record of your growth. Every achievement, skill, and milestone — visualized and real.'},
    {icon:'🎮',title:'GameFlix',color:'#ffaa00',desc:'Gaming with purpose. Stream, play, earn — every action feeds back into your progression.'},
    {icon:'🏪',title:'Marketplace',color:'#ff6b00',desc:'Create, sell, and build. Your products, your storefront, powered by the Nexus ecosystem.'},
    {icon:'⚡',title:'Z-RNA Portal',color:'#ff4466',desc:'Your contribution record. Non-tradable, permanent, meaningful. Legacy through action.'},
    {icon:'👥',title:'Community Network',color:'#00e5ff',desc:'Groups, mentorship, collaboration. The people who push you forward are here.'},
    {icon:'🎨',title:'Creator Studio',color:'#39ff14',desc:'Publish books, videos, and assets. AI-assisted creation tools built for the serious creator.'},
    {icon:'📊',title:'Intelligence Layer',color:'#a855f7',desc:'Personalized recommendations and pattern detection. Nexus learns what works for you.'},
  ];
  return (
    <div style={{background:'#03050f',color:'#dde0ff',fontFamily:'system-ui,sans-serif',overflowX:'hidden'}}>
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,padding:'16px 24px',display:'flex',justifyContent:'space-between',alignItems:'center',background:scrolled?'rgba(3,5,15,0.95)':'transparent',borderBottom:scrolled?'1px solid rgba(0,229,255,0.1)':'none',backdropFilter:scrolled?'blur(10px)':'none',transition:'all 0.3s'}}>
        <div style={{color:'#00e5ff',fontSize:22,fontWeight:900,letterSpacing:4,fontFamily:'monospace',textShadow:'0 0 12px rgba(0,229,255,0.4)'}}>N3XUS</div>
        <a href="/auth" style={{padding:'10px 24px',background:'linear-gradient(135deg,#00e5ff,#0088cc)',color:'#000',borderRadius:8,fontFamily:'monospace',fontSize:12,fontWeight:700,letterSpacing:2,textDecoration:'none'}}>ENTER →</a>
      </nav>
      <section style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'120px 24px 80px'}}>
        <Orb/>
        <div style={{fontSize:13,color:'#00e5ff',letterSpacing:6,fontFamily:'monospace',marginBottom:24,opacity:0.7}}>THE FUTURE STARTS HERE</div>
        <h1 style={{fontSize:'clamp(44px,9vw,88px)',fontWeight:900,lineHeight:1.05,margin:'0 0 24px',letterSpacing:-2,background:'linear-gradient(135deg,#ffffff 0%,#00e5ff 50%,#0066ff 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>The Platform<br/>That Builds You</h1>
        <p style={{fontSize:'clamp(15px,2.5vw,20px)',color:'#7070a0',maxWidth:580,lineHeight:1.8,margin:'0 0 48px'}}>N3XUS is a living ecosystem where AI agents work for you, education is free forever, and your growth is tracked, rewarded, and real.</p>
        <VoiceButton/>
        <div style={{display:'flex',gap:16,flexWrap:'wrap',justifyContent:'center'}}>
          <a href="/auth" style={{padding:'16px 40px',background:'linear-gradient(135deg,#00e5ff,#0066ff)',color:'#000',borderRadius:12,fontSize:15,fontWeight:700,fontFamily:'monospace',letterSpacing:2,textDecoration:'none',boxShadow:'0 0 30px rgba(0,229,255,0.4)'}}>JOIN NEXUS</a>
          <a href="#modules" style={{padding:'16px 40px',background:'transparent',border:'1px solid rgba(0,229,255,0.3)',color:'#00e5ff',borderRadius:12,fontSize:15,fontFamily:'monospace',letterSpacing:2,textDecoration:'none'}}>SEE WHAT'S INSIDE</a>
        </div>
      </section>
      <section style={{padding:'60px 24px',borderTop:'1px solid rgba(255,255,255,0.04)'}}>
        <div style={{maxWidth:700,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:40,textAlign:'center'}}>
          {[{n:'10+',l:'CORE MODULES'},{n:'100%',l:'FREE EDUCATION'},{n:'$0',l:'TO JOIN'}].map(x=>(
            <div key={x.l}><div style={{fontSize:40,fontWeight:900,color:'#00e5ff',fontFamily:'monospace',textShadow:'0 0 20px rgba(0,229,255,0.4)'}}>{x.n}</div><div style={{color:'#505070',fontSize:10,letterSpacing:3,marginTop:4,fontFamily:'monospace'}}>{x.l}</div></div>
          ))}
        </div>
      </section>
      <section style={{padding:'60px 24px',maxWidth:800,margin:'0 auto',textAlign:'center'}}>
        <div style={{color:'#252545',fontFamily:'monospace',fontSize:11,letterSpacing:4,marginBottom:20}}>THE VISION</div>
        <blockquote style={{fontSize:'clamp(18px,3vw,26px)',lineHeight:1.7,color:'#9090bb',fontStyle:'italic',margin:0,padding:'0 20px',borderLeft:'3px solid rgba(0,229,255,0.3)'}}>
          "We are building a world where intelligence is free, growth is real, and the tools that used to belong to the few now belong to everyone."
        </blockquote>
        <div style={{color:'#00e5ff',marginTop:20,fontFamily:'monospace',fontSize:11,letterSpacing:3}}>— KEVIN ALBERT · FOUNDER OF NEXUS</div>
      </section>
      <section id="modules" style={{padding:'60px 24px'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:50}}>
            <div style={{color:'#252545',fontFamily:'monospace',fontSize:11,letterSpacing:4,marginBottom:16}}>THE ECOSYSTEM</div>
            <h2 style={{fontSize:'clamp(26px,5vw,44px)',fontWeight:900,margin:0,color:'#dde0ff'}}>9 Systems. One Platform.</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:14}}>
            {modules.map((m,i)=>(
              <div key={i} style={{background:'rgba(5,12,30,0.8)',border:`1px solid rgba(255,255,255,0.06)`,borderRadius:14,padding:'22px 18px'}}>
                <div style={{fontSize:28,marginBottom:10}}>{m.icon}</div>
                <div style={{color:'#dde0ff',fontSize:13,fontWeight:700,marginBottom:6,letterSpacing:1}}>{m.title}</div>
                <div style={{color:'#505070',fontSize:12,lineHeight:1.7}}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section style={{padding:'80px 24px',textAlign:'center'}}>
        <div style={{maxWidth:600,margin:'0 auto',background:'rgba(0,229,255,0.03)',border:'1px solid rgba(0,229,255,0.1)',borderRadius:24,padding:'60px 32px'}}>
          <h2 style={{fontSize:'clamp(26px,5vw,44px)',fontWeight:900,margin:'0 0 16px',color:'#dde0ff'}}>Ready to evolve?</h2>
          <p style={{color:'#505070',marginBottom:40,lineHeight:1.7}}>Join the platform building the future.<br/>Free. Forever.</p>
          <a href="/auth" style={{display:'inline-block',padding:'18px 48px',background:'linear-gradient(135deg,#00e5ff,#0066ff)',color:'#000',borderRadius:12,fontSize:16,fontWeight:900,fontFamily:'monospace',letterSpacing:3,textDecoration:'none',boxShadow:'0 0 40px rgba(0,229,255,0.4)'}}>JOIN NEXUS NOW</a>
          <div style={{color:'#252545',fontSize:10,marginTop:16,fontFamily:'monospace',letterSpacing:2}}>FREE · NO CREDIT CARD · NO LIMITS</div>
        </div>
      </section>
      <footer style={{padding:'40px 24px',borderTop:'1px solid rgba(255,255,255,0.04)',textAlign:'center'}}>
        <div style={{color:'#00e5ff',fontSize:18,fontWeight:900,letterSpacing:4,fontFamily:'monospace',marginBottom:6}}>N3XUS</div>
        <div style={{color:'#252545',fontSize:10,fontFamily:'monospace',letterSpacing:2}}>BUILT BY KEVIN ALBERT · POWERED BY AI · FREE FOREVER</div>
      </footer>
    </div>
  );
}
