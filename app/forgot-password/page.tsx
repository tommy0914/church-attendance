'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg({ type: '', text: '' })
    
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setMsg({ type: 'error', text: error.message })
    } else {
      setMsg({ type: 'success', text: 'Password reset link sent! Please check your email inbox.' })
    }
    setLoading(false)
  }

  return (
    <div className="page-center" style={{ padding: 24 }}>
      <div className="fade-in" style={{ width: '100%', maxWidth: 420 }}>
        <div className="text-center" style={{ marginBottom: 36 }}>
          <div style={{
            width: 60, height: 60,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
            borderRadius: 16,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', marginBottom: 16,
            boxShadow: '0 0 30px var(--accent-glow)'
          }}>🗝️</div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: 6 }}>Forgot Password?</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Enter your email to receive a recovery link</p>
        </div>

        <div className="card">
          {msg.text && (
            <div className={`alert ${msg.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 20 }}>
              <span>{msg.type === 'error' ? '⚠️' : '✅'}</span> {msg.text}
            </div>
          )}

          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : 'Send Reset Link'}
            </button>

            <Link href="/login" style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
              ← Back to Login
            </Link>
          </form>
        </div>
      </div>
    </div>
  )
}
