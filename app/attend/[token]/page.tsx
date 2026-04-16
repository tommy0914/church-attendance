'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Status = 'loading' | 'success' | 'duplicate' | 'invalid' | 'offline' | 'error'

export default function AttendPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [status, setStatus] = useState<Status>('loading')
  const [serviceName, setServiceName] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    recordAttendance()
  }, [token])

  async function recordAttendance() {
    const supabase = createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Find service by qr_token
    const { data: service, error: svcErr } = await supabase
      .from('services')
      .select('id, name, start_time, end_time')
      .eq('qr_token', token)
      .single()

    if (svcErr || !service) {
      setStatus('invalid')
      setMessage('This QR code is not valid or the service no longer exists.')
      return
    }

    setServiceName(service.name)

    // Attempt to record attendance
    const { error: attErr } = await supabase
      .from('attendance')
      .insert({ user_id: user.id, service_id: service.id })

    if (attErr) {
      if (attErr.code === '23505') {
        // Unique constraint — already recorded
        setStatus('duplicate')
        setMessage('You have already been marked present for this service.')
      } else {
        // Offline or other error — save to localStorage
        saveOffline(user.id, service.id, token)
        setStatus('offline')
        setMessage('You appear to be offline. Attendance has been saved and will sync automatically when you reconnect.')
      }
      return
    }

    setStatus('success')
    setMessage(`You have been marked present for ${service.name}!`)
  }

  function saveOffline(userId: string, serviceId: string, qrToken: string) {
    try {
      const pending = JSON.parse(localStorage.getItem('pending_attendance') || '[]')
      pending.push({ userId, serviceId, qrToken, scanned_at: new Date().toISOString() })
      localStorage.setItem('pending_attendance', JSON.stringify(pending))
    } catch { /* ignore */ }
  }

  const states: Record<Status, { icon: string; title: string; color: string }> = {
    loading: { icon: '⏳', title: 'Recording attendance…', color: 'var(--text-secondary)' },
    success: { icon: '✅', title: 'Attendance Recorded!', color: 'var(--success)' },
    duplicate: { icon: '🔁', title: 'Already Recorded', color: 'var(--warning)' },
    invalid: { icon: '❌', title: 'Invalid QR Code', color: 'var(--error)' },
    offline: { icon: '📶', title: 'Saved Offline', color: 'var(--gold)' },
    error: { icon: '⚠️', title: 'Something went wrong', color: 'var(--error)' },
  }

  const s = states[status]

  return (
    <div className="page-center" style={{ padding: 24 }}>
      <div className="card fade-in text-center" style={{ maxWidth: 440, width: '100%' }}>
        {/* Icon */}
        <div style={{ fontSize: '5rem', marginBottom: 20 }}>
          {status === 'loading' ? <span className="spinner" style={{ width: 48, height: 48, display: 'inline-block', borderWidth: 3 }} /> : s.icon}
        </div>

        <h2 style={{ fontSize: '1.4rem', marginBottom: 8, color: s.color }}>{s.title}</h2>
        {serviceName && <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{serviceName}</p>}
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{message}</p>

        {/* Actions (after loading) */}
        {status !== 'loading' && (
          <div style={{ marginTop: 28, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/dashboard/profile')} className="btn btn-primary">
              View My Attendance
            </button>
            <button onClick={() => router.push('/dashboard/scan')} className="btn btn-secondary">
              Scan Another
            </button>
          </div>
        )}

        {/* Offline pending indicator */}
        {status === 'offline' && (
          <div style={{
            marginTop: 20, padding: '12px 16px',
            background: 'var(--warning-bg)', borderRadius: 10,
            fontSize: '0.8rem', color: 'var(--warning)'
          }}>
            💡 Attendance will automatically upload when you&apos;re back online.
          </div>
        )}
      </div>
    </div>
  )
}
