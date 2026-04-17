'use client'
import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const ADMIN_CODE = 'CHURCH-ADMIN-2024' // change this secret in production

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [form, setForm] = useState({ 
    name: '', email: '', password: '', phone: '', 
    gender: '', level: '', adminCode: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAdminCode, setShowAdminCode] = useState(false)
  const [isSignedUp, setIsSignedUp] = useState(false)

  const nextUrl = searchParams.get('next')

  function update(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    const isAdmin = form.adminCode === ADMIN_CODE

    const supabase = createClient()
    const { data, error: signupError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { 
          name: form.name, 
          phone: form.phone,
          gender: form.gender,
          level: form.level,
          role: isAdmin ? 'admin' : 'user'
        }
      }
    })

    if (signupError) {
      if (signupError.message.includes('rate limit')) {
        setError('Verification email already sent. Please wait an hour before requesting another.')
      } else if (signupError.message.includes('Error sending confirmation email')) {
        setError('System busy: Email limit reached. Please try again in an hour or contact the church admin.')
      } else {
        setError(signupError.message)
      }
      setLoading(false)
      return
    }

    setIsSignedUp(true)
    setLoading(false)
  }

  if (isSignedUp) {
    return (
      <div className="page-center" style={{ padding: 24 }}>
        <div className="card fade-in" style={{ width: '100%', maxWidth: 440, textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: '4rem', marginBottom: 20 }}>📧</div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 12 }}>Check your email</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
            We've sent a verification link to <strong>{form.email}</strong>.<br/> 
            Please click the link in your inbox (or spam folder) to activate your account.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link href="/login" className="btn btn-primary">
              Return to Login
            </Link>
            <button onClick={() => setIsSignedUp(false)} className="btn btn-ghost">
              I used the wrong email address
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-center" style={{ padding: 24 }}>
      <div className="fade-in" style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div className="text-center" style={{ marginBottom: 36 }}>
          <div style={{
            width: 60, height: 60,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
            borderRadius: 16,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', marginBottom: 16,
            boxShadow: '0 0 30px var(--accent-glow)'
          }}>✝️</div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: 6 }}>Create an account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Join your church community</p>
        </div>

        <div className="card">
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div className="alert alert-error">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input id="name" type="text" className="form-input" placeholder="John Doe"
                value={form.name} onChange={e => update('name', e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input id="reg-email" type="email" className="form-input" placeholder="you@example.com"
                value={form.email} onChange={e => update('email', e.target.value)} required autoComplete="email" />
            </div>

            <div className="grid-2" style={{ gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-input" value={form.gender} onChange={e => update('gender', e.target.value)} required>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Current Level</label>
                <select className="form-input" value={form.level} onChange={e => update('level', e.target.value)} required>
                  <option value="">Select Level</option>
                  <option value="100L">100L</option>
                  <option value="200L">200L</option>
                  <option value="300L">300L</option>
                  <option value="400L">400L</option>
                  <option value="500L">500L</option>
                  <option value="Other">Other / Non-Student</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
              <input id="phone" type="tel" className="form-input" placeholder="+1 234 567 8900"
                value={form.phone} onChange={e => update('phone', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="form-input-icon">
                <span className="icon">🔒</span>
                <input id="reg-password" type={showPassword ? 'text' : 'password'} className="form-input" placeholder="Min. 6 characters"
                  value={form.password} onChange={e => update('password', e.target.value)}
                  required minLength={6} autoComplete="new-password" />
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
              <label className="form-label">Confirm Password</label>
              <div className="form-input-icon">
                <span className="icon">🔒</span>
                <input id="reg-confirm" type={showPassword ? 'text' : 'password'} className="form-input" placeholder="Repeat password"
                  value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)}
                  required minLength={6} autoComplete="new-password" />
              </div>
            </div>

            {/* Admin code toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdminCode(!showAdminCode)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                🔑 Registering as an admin?
              </button>
              {showAdminCode && (
                <input
                  id="admin-code"
                  type="password"
                  className="form-input"
                  placeholder="Enter admin invite code"
                  value={form.adminCode}
                  onChange={e => update('adminCode', e.target.value)}
                  style={{ marginTop: 8 }}
                />
              )}
            </div>

            <button
              id="register-btn"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {loading ? <><span className="spinner" />Creating account…</> : 'Create Account'}
            </button>
          </form>

          <div className="divider" style={{ margin: '20px 0' }}>or</div>

          <p className="text-center" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href={nextUrl ? `/login?next=${encodeURIComponent(nextUrl)}` : '/login'} style={{ color: 'var(--accent-light)', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="page-center"><span className="spinner" /></div>}>
      <RegisterForm />
    </Suspense>
  )
}
