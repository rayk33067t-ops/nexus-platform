'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function signUp() {
    const { error } = await supabase.auth.signUp({ email, password })
    setMessage(error ? error.message : 'Check your email to confirm!')
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setMessage(error ? error.message : 'Signed in!')
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
