'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Fast-path: check localStorage for any Supabase session key instantly
    const hasSession = Object.keys(localStorage).some(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
    if (hasSession) {
      // Optimistically redirect, Supabase middleware will guard the route
      router.replace('/dashboard/profile')
      return
    }

    // No cached session — verify with network (needed for first visit / expired tokens)
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard/profile')
      else setChecking(false)
    })
  }, [router])

  if (checking) {
    return (
      <div className="page-center">
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div className="text-center fade-in" style={{ maxWidth: 600 }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <div style={{
              width: 80, height: 80,
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
              borderRadius: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem',
              boxShadow: '0 0 60px var(--accent-glow)',
              animation: 'pulse-glow 3s ease-in-out infinite'
            }}>
              ✝️
            </div>
          </div>

          <h1 style={{ fontSize: '3rem', marginBottom: 16 }}>
            <span style={{
              background: 'linear-gradient(135deg, var(--text-primary), var(--accent-light))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              ChurchAttend
            </span>
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginBottom: 48, lineHeight: 1.8 }}>
            Smart QR-based attendance tracking for your church community.
            Simple, fast, and works offline.
          </p>

          <div className="flex items-center justify-center gap-4" style={{ flexWrap: 'wrap' }}>
            <Link href="/login" className="btn btn-primary btn-lg">
              Sign In
            </Link>
            <Link href="/register" className="btn btn-secondary btn-lg">
              Create Account
            </Link>
          </div>

          {/* Features */}
          <div className="grid-3" style={{ marginTop: 64, gap: 16 }}>
            {[
              { icon: '📱', title: 'QR Scanning', desc: 'Scan codes with your phone camera in seconds' },
              { icon: '📊', title: 'Track History', desc: 'View your full attendance record anytime' },
              { icon: '🔌', title: 'Works Offline', desc: 'Records sync automatically when back online' },
            ].map((f) => (
              <div key={f.title} className="card" style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.8rem', borderTop: '1px solid var(--border)' }}>
        © {new Date().getFullYear()} ChurchAttend · Built with ♥
      </footer>
    </div>
  )
}
