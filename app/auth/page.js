'use client'
import { useState } from 'react'

const SUPABASE_URL = 'https://ojsaslvryarknhttindm.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qc2FzbHZyeWFya25odHRpbmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzUxNjcsImV4cCI6MjA5NzIxMTE2N30.kSFe8YMeV9aqTWDPKGjqsu-9J9tB9Pm7wXy_R002rTI'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function signIn() {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setMessage(error ? error.message : 'Signed in!')
    } catch(e) { setMessage(e.message) }
  }

  async function signUp() {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
      const { error } = await supabase.auth.signUp({ email, password })
      setMessage(error ? error.message : 'Check your email!')
    } catch(e) { setMessage(e.message) }
  }

  return (
    <div style={{padding:'20px'}}>
      <h1>Nexus Auth</h1>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{display:'block',margin:'10px 0',padding:'8px',width:'100%'}}/>
      <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{display:'block',margin:'10px 0',padding:'8px',width:'100%'}}/>
      <button onClick={signUp} style={{marginRight:'10px',padding:'10px 20px'}}>Sign Up</button>
      <button onClick={signIn} style={{padding:'10px 20px'}}>Sign In</button>
      <p>{message}</p>
    </div>
  )
}
