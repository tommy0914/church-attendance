'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Service {
  id: string
  name: string
  description: string | null
  start_time: string
  end_time: string
  qr_token: string
  created_at: string
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', start_time: '', end_time: '', latitude: null as number | null, longitude: null as number | null })
  const [creating, setCreating] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { loadServices() }, [])

  async function loadServices() {
    const supabase = createClient()
    const { data } = await supabase
      .from('services')
      .select('*')
      .order('start_time', { ascending: false })
    setServices(data ?? [])
    setLoading(false)
  }

  async function createService(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setMsg('')
    const supabase = createClient()
    const { error } = await supabase.from('services').insert({
      name: form.name,
      description: form.description || null,
      start_time: form.start_time,
      end_time: form.end_time,
      latitude: form.latitude,
      longitude: form.longitude,
    })

    if (error) {
      setMsg('Error: ' + error.message)
    } else {
      setForm({ name: '', description: '', start_time: '', end_time: '', latitude: null, longitude: null })
      setShowForm(false)
      await loadServices()
    }
    setCreating(false)
  }

  function getLocation() {
    if (!navigator.geolocation) {
      setMsg('Error: Geolocation is not supported by your browser.')
      return
    }
    setMsg('Fetching location...')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(p => ({ ...p, latitude: pos.coords.latitude, longitude: pos.coords.longitude }))
        setMsg('')
      },
      (err) => {
        setMsg('Error getting location: ' + err.message)
      },
      { enableHighAccuracy: true }
    )
  }

  async function deleteService(id: string) {
    if (!confirm('Delete this service? Attendance records will also be removed.')) return
    const supabase = createClient()
    await supabase.from('services').delete().eq('id', id)
    setServices(prev => prev.filter(s => s.id !== id))
  }

  async function downloadCSV(serviceId: string, serviceName: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('attendance')
      .select('scanned_at, profiles(name, phone, level, gender)')
      .eq('service_id', serviceId)

    if (error || !data) {
      alert('Error fetching attendance: ' + (error?.message || 'No data'))
      return
    }

    const headers = ['Name', 'Phone', 'Gender', 'Level', 'Check-in Time']
    const rows = data.map((a: any) => [
      a.profiles?.name || 'Unknown',
      a.profiles?.phone || '—',
      a.profiles?.gender || '—',
      a.profiles?.level || '—',
      new Date(a.scanned_at).toLocaleString()
    ])

    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${serviceName.replace(/\s+/g, '_')}_Attendance.csv`
    a.click()
  }

  return (
    <div className="layout-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Church Services</h1>
          <p className="page-subtitle">Create and manage services, generate QR codes</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ New Service'}
        </button>
      </div>

      {/* QR Code workflow info banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(108,99,255,0.05))',
        border: '1px solid rgba(108,99,255,0.3)',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 24,
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '1.6rem' }}>📱</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, marginBottom: 4, color: 'var(--accent-light)' }}>How to Generate a QR Code</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Step 1:</strong> Create a service below →{' '}
            <strong style={{ color: 'var(--text-secondary)' }}>Step 2:</strong> Click the <span style={{ color: 'var(--accent-light)' }}>📱 Show QR</span> button →{' '}
            <strong style={{ color: 'var(--text-secondary)' }}>Step 3:</strong> Display or print the QR code for members to scan with their phone
          </p>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card fade-in" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 20 }}>Create New Service</h3>
          {msg && <div className="alert alert-error" style={{ marginBottom: 16 }}>{msg}</div>}
          <form onSubmit={createService} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Service Name *</label>
                <input type="text" className="form-input" placeholder="e.g. Sunday Morning Service"
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input type="text" className="form-input" placeholder="Optional description"
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Start Time *</label>
                <input type="datetime-local" className="form-input"
                  value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">End Time *</label>
                <input type="datetime-local" className="form-input"
                  value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Geofencing (Optional)</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
                  <button type="button" onClick={getLocation} className="btn btn-secondary btn-sm">
                    📍 Set to My Current Location
                  </button>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {form.latitude && form.longitude 
                      ? <>Pinned: {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}</>
                      : 'Not set (Anyone can scan from anywhere)'}
                  </span>
                  {form.latitude && (
                    <button type="button" onClick={() => setForm(p => ({ ...p, latitude: null, longitude: null }))} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.85rem' }}>
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? <><span className="spinner" /> Creating…</> : '✅ Create Service'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Services list */}
      {loading ? (
        <div className="text-center" style={{ padding: 60 }}>
          <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} />
        </div>
      ) : services.length === 0 ? (
        <div className="card text-center" style={{ padding: '60px 24px' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🗓️</div>
          <h3>No services yet</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Create your first church service to generate a QR code.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {services.map(svc => (
            <div key={svc.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.05rem', marginBottom: 4 }}>{svc.name}</h3>
                {svc.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 6 }}>{svc.description}</p>}
                <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>🕐 {new Date(svc.start_time).toLocaleString()}</span>
                  <span>→ {new Date(svc.end_time).toLocaleString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                <button onClick={() => downloadCSV(svc.id, svc.name)} className="btn btn-secondary btn-sm" title="Download Report">
                  📥 Export
                </button>
                <Link href={`/admin/qr/${svc.id}`} className="btn btn-primary btn-sm">
                  📱 Show QR
                </Link>
                <button onClick={() => deleteService(svc.id)} className="btn btn-danger btn-sm">
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
