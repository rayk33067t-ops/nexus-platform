export default function Home() {
  return (
    <div style={{minHeight:'100vh',background:'#03050f',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'monospace'}}>
      <div style={{color:'#00e5ff',fontSize:48,fontWeight:700,letterSpacing:8,textShadow:'0 0 20px rgba(0,229,255,0.5)'}}>N3XUS</div>
      <div style={{color:'#ffffff',fontSize:18,marginTop:16,letterSpacing:4}}>PLATFORM</div>
      <div style={{color:'#303050',fontSize:12,marginTop:8,letterSpacing:2}}>Building the future.</div>
      <a href="/auth" style={{marginTop:40,padding:'14px 32px',background:'transparent',border:'1px solid rgba(0,229,255,0.4)',borderRadius:10,color:'#00e5ff',fontFamily:'monospace',fontSize:14,letterSpacing:2,textDecoration:'none'}}>ENTER</a>
    </div>
  )
}
