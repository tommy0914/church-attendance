'use client'
import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const nextUrl = searchParams.get('next')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // If there's a nextUrl set, redirect them directly there (e.g. from QR scan)
      if (nextUrl) {
        router.push(nextUrl)
      } else {
        // Otherwise, standard redirection logic
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single()

        if (profile?.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/dashboard/profile')
        }
      }
      router.refresh()
    }
  }

  return (
    <div className="page-center" style={{ padding: 24 }}>
      <div className="card-glass fade-in" style={{ maxWidth: 420, width: '100%', padding: 40, border: '1px solid var(--border-strong)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>⛪</div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Faith Baptist Young Adult Portal</p>
        </div>

        <div className="card">
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {error && (
              <div className="alert alert-error">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email address</label>
              <div className="form-input-icon">
                <span className="icon">✉️</span>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--accent-light)', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="form-input-icon">
                <span className="icon">🔒</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-muted)' }}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            <button
              id="login-btn"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {loading ? <><span className="spinner" />Signing in…</> : 'Sign In'}
            </button>
          </form>

          <div className="divider" style={{ margin: '20px 0' }}>or</div>

          <p className="text-center" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Don&apos;t have an account?{' '}
            <Link href={nextUrl ? `/register?next=${encodeURIComponent(nextUrl)}` : '/register'} style={{ color: 'var(--accent-light)', fontWeight: 600 }}>
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="page-center"><span className="spinner" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
