'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Status = 'loading' | 'success' | 'duplicate' | 'invalid' | 'offline' | 'error' | 'too_far' | 'locating' | 'location_error'

// Haversine formula to calculate distance in meters
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth's radius in meters
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(dp/2) * Math.sin(dp/2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

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
      .select('id, name, start_time, end_time, latitude, longitude')
      .eq('qr_token', token)
      .single()

    if (svcErr || !service) {
      setStatus('invalid')
      setMessage('This QR code is not valid or the service no longer exists.')
      return
    }

    setServiceName(service.name)

    // Check Geofence
    if (service.latitude !== null && service.longitude !== null) {
      setStatus('locating')
      setMessage('Verifying your location to ensure you are at the church premises...')

      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) reject(new Error('unsupported'))
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true })
        })

        const dist = getDistanceInMeters(
          pos.coords.latitude, pos.coords.longitude,
          service.latitude, service.longitude
        )

        // 300 meters buffer
        if (dist > 300) {
          setStatus('too_far')
          setMessage(`You are approximately ${Math.round(dist)} meters away from the building. You must be on the church premises to check in.`)
          return
        }
      } catch (err: any) {
        setStatus('location_error')
        setMessage('We could not access your location. Please allow location permissions in your browser settings to check in.')
        return
      }
    }

    setStatus('loading')

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
    locating: { icon: '📍', title: 'Verifying Location…', color: 'var(--accent-light)' },
    loading: { icon: '⏳', title: 'Recording attendance…', color: 'var(--text-secondary)' },
    success: { icon: '✅', title: 'Attendance Recorded!', color: 'var(--success)' },
    duplicate: { icon: '🔁', title: 'Already Recorded', color: 'var(--warning)' },
    invalid: { icon: '❌', title: 'Invalid QR Code', color: 'var(--error)' },
    offline: { icon: '📶', title: 'Saved Offline', color: 'var(--gold)' },
    too_far: { icon: '🗺️', title: 'Too Far Away', color: 'var(--error)' },
    location_error: { icon: '🔒', title: 'Location Blocked', color: 'var(--warning)' },
    error: { icon: '⚠️', title: 'Something went wrong', color: 'var(--error)' },
  }

  const s = states[status]

  return (
    <div className="page-center" style={{ padding: 24 }}>
      <div className="card fade-in text-center" style={{ maxWidth: 440, width: '100%' }}>
        {/* Icon */}
        <div style={{ fontSize: '5rem', marginBottom: 20 }}>
          {(status === 'loading' || status === 'locating') ? <span className="spinner" style={{ width: 48, height: 48, display: 'inline-block', borderWidth: 3, borderColor: `${s.color} transparent transparent transparent` }} /> : s.icon}
        </div>

        <h2 style={{ fontSize: '1.4rem', marginBottom: 8, color: s.color }}>{s.title}</h2>
        {serviceName && <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{serviceName}</p>}
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{message}</p>

        {/* Actions (after logic) */}
        {(status !== 'loading' && status !== 'locating') && (
          <div style={{ marginTop: 28, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/dashboard/profile')} className="btn btn-primary">
              View My Attendance
            </button>
            <button onClick={() => {
              if (status === 'too_far' || status === 'location_error') window.location.reload()
              else router.push('/dashboard/scan')
            }} className="btn btn-secondary">
              {status === 'too_far' || status === 'location_error' ? 'Retry Check-in' : 'Scan Another'}
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
