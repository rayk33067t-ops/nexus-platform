'use client'
import { useState, useEffect } from 'react'

export default function IntroPage() {
  const [scene, setScene] = useState(1)
  const [showText, setShowText] = useState(false)
  const [orbZoom, setOrbZoom] = useState(0.15)

  useEffect(() => {
    const t1 = setTimeout(() => setScene(2), 800)
    const t2 = setTimeout(() => {
      setScene(3)
      let z = 0.15
      const zoomInterval = setInterval(() => {
        z += 0.025
        setOrbZoom(z)
        if (z >= 1.4) clearInterval(zoomInterval)
      }, 60)
    }, 2000)
    const t3 = setTimeout(() => setShowText(true), 7500)
    const t4 = setTimeout(() => setShowText(false), 9500)
    const t5 = setTimeout(() => setScene(5), 10500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5) }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', position: 'relative' }}>
      {scene < 5 && (
        <div style={{ position: 'absolute', inset: 0, opacity: scene >= 1 ? 1 : 0, transition: 'opacity 1.5s ease' }}>
          <iframe
            src="/orb-engine/index.html"
            style={{
              width: '100%', height: '100%', border: 'none',
              transform: `scale(${orbZoom})`,
              transition: 'transform 0.1s linear',
              transformOrigin: 'center center',
            }}
            title="Nexus Orb"
          />
        </div>
      )}
      {showText && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: orbZoom > 1.2 ? 'rgba(255,255,255,0.95)' : 'transparent',
          transition: 'background 1s ease', zIndex: 10,
        }}>
          <p style={{
            color: orbZoom > 1.2 ? '#000' : '#fff',
            fontSize: 'clamp(20px, 4vw, 32px)',
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            letterSpacing: '0.02em', textAlign: 'center', padding: '0 24px',
            opacity: showText ? 1 : 0, transition: 'opacity 1.5s ease',
          }}>
            Every evolution begins with a choice.
          </p>
        </div>
      )}
      {scene === 5 && (
        <div style={{
          position: 'absolute', inset: 0, background: '#020410',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(0,150,255,0.12) 0%, transparent 60%)' }} />
          <div style={{
            color: '#3a4a6a', fontFamily: 'monospace', fontSize: 12,
            letterSpacing: 3, marginBottom: 24, textAlign: 'center', padding: '0 32px',
          }}>
            GENESIS BOARDROOM SCENE<br/>
            <span style={{ fontSize: 10, opacity: 0.6 }}>awaiting recording</span>
          </div>
          <div style={{ textAlign: 'center', opacity: 0.9 }}>
            <div style={{ color: '#00e5ff', fontFamily: 'monospace', fontSize: 14, letterSpacing: 6, fontWeight: 700 }}>NEXUS</div>
            <div style={{ color: '#7d8ba8', fontFamily: 'monospace', fontSize: 11, letterSpacing: 3, marginTop: 6 }}>EVOLUTION STARTS HERE</div>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                marginTop: 24, padding: '12px 32px',
                background: 'linear-gradient(135deg, #00e5ff, #0066ff)',
                border: 'none', borderRadius: 999, color: '#000',
                fontFamily: 'monospace', fontWeight: 700, fontSize: 13, letterSpacing: 2, cursor: 'pointer',
              }}
            >ENTER NEXUS</button>
          </div>
        </div>
      )}
    </div>
  )
}
