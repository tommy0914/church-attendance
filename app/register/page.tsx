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
    gender: '', level: '', adminCode: '' 
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAdminCode, setShowAdminCode] = useState(false)

  const nextUrl = searchParams.get('next')

  function update(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
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
          level: form.level
        }
      }
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    // If admin code provided, update role
    if (isAdmin && data.user) {
      await supabase
        .from('profiles')
        .update({ 
          role: 'admin', 
          phone: form.phone,
          gender: form.gender,
          level: form.level
        })
        .eq('id', data.user.id)
    } else if (data.user) {
      await supabase
        .from('profiles')
        .update({ 
          phone: form.phone,
          gender: form.gender,
          level: form.level
        })
        .eq('id', data.user.id)
    }

    if (nextUrl) {
      router.push(nextUrl)
    } else if (isAdmin) {
      router.push('/admin')
    } else {
      router.push('/dashboard/profile')
    }
    router.refresh()
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
              <input id="reg-password" type="password" className="form-input" placeholder="Min. 6 characters"
                value={form.password} onChange={e => update('password', e.target.value)}
                required minLength={6} autoComplete="new-password" />
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
