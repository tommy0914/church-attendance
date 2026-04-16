'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateErr } = await supabase.auth.updateUser({ password })

    if (updateErr) {
      setError(updateErr.message)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
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
          }}>🛡️</div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: 6 }}>Set New Password</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Please enter your new secure password</p>
        </div>

        <div className="card">
          {success ? (
            <div className="text-center" style={{ padding: '20px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
              <h3 style={{ marginBottom: 8 }}>Password Updated!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Redirecting you to login in a few seconds...</p>
            </div>
          ) : (
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {error && (
                <div className="alert alert-error">
                  <span>⚠️</span> {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="form-input-icon">
                  <span className="icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
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

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div className="form-input-icon">
                  <span className="icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
