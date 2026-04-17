'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  name: string
  phone: string
  address: string
  avatar_url: string | null
  gender: string | null
  level: string | null
  role: string
  created_at: string
}

interface AttendanceRecord {
  id: string
  scanned_at: string
  services: { name: string; start_time: string } | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', address: '', gender: '', level: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: p }, { data: a }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('attendance')
        .select('id, scanned_at, services(name, start_time)')
        .eq('user_id', user.id)
        .order('scanned_at', { ascending: false })
        .limit(20)
    ])

    if (p) {
      setProfile(p)
      setForm({ 
        name: p.name, 
        phone: p.phone || '', 
        address: p.address || '',
        gender: p.gender || '',
        level: p.level || ''
      })
    }
    if (a) setAttendance(a as unknown as AttendanceRecord[])
  }

  async function saveProfile() {
    if (!profile) return
    setSaving(true)
    setMsg('')
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update(form)
      .eq('id', profile.id)

    if (error) setMsg('Error: ' + error.message)
    else {
      setProfile(prev => prev ? { ...prev, ...form } : prev)
      setEditing(false)
      setMsg('Profile updated!')
    }
    setSaving(false)
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${profile.id}/avatar.${ext}`

    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (upErr) { setMsg('Upload failed: ' + upErr.message); setUploading(false); return }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)

    // Add a cache-busting timestamp to the URL to force the browser to reload the new image
    const publicUrlWithCacheBust = `${data.publicUrl}?t=${Date.now()}`

    await supabase.from('profiles').update({ avatar_url: publicUrlWithCacheBust }).eq('id', profile.id)
    setProfile(prev => prev ? { ...prev, avatar_url: publicUrlWithCacheBust } : prev)
    setUploading(false)
    setMsg('Avatar updated!')
  }

  if (!profile) {
    return (
      <div className="page-center">
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  return (
    <div className="layout-container">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your account and view attendance history</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Profile Card */}
        <div className="card" style={{ textAlign: 'center' }}>
          {/* Avatar */}
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: 100, height: 100,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem',
              margin: '0 auto 16px',
              cursor: 'pointer',
              overflow: 'hidden',
              border: '3px solid var(--border-strong)',
              position: 'relative'
            }}
          >
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : profile.name[0].toUpperCase()
            }
            {uploading && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div className="spinner" />
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={uploadAvatar} style={{ display: 'none' }} />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>Click avatar to change photo</p>

          <h2 style={{ fontSize: '1.2rem', marginBottom: 4 }}>{profile.name}</h2>
          <span className={`badge ${profile.role === 'admin' ? 'badge-admin' : 'badge-member'}`}>
            {profile.role}
          </span>

          <div style={{ marginTop: 20, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span>✉️ </span>{profile.id.slice(0, 8)}…
            </div>
            {profile.phone && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📞 {profile.phone}</div>}
            {profile.gender && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>👤 {profile.gender}</div>}
            {profile.level && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>🎓 {profile.level}</div>}
            {profile.address && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📍 {profile.address}</div>}
          </div>

          <button
            onClick={() => setEditing(!editing)}
            className="btn btn-secondary btn-full"
            style={{ marginTop: 20 }}
          >
            {editing ? 'Cancel' : '✏️ Edit Profile'}
          </button>

          <div style={{ marginTop: 16, padding: '12px', background: 'var(--bg-secondary)', borderRadius: 10 }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-light)' }}>{attendance.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Services Attended</div>
          </div>

          {/* Badges Section */}
          <div style={{ marginTop: 24, textAlign: 'left' }}>
            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Achievements</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
               {attendance.length >= 10 && (
                 <div className="achievement-badge" title="Attended 10+ services">⭐ Dedicated</div>
               )}
               {(() => {
                 const thirtyDaysAgo = new Date()
                 thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                 const recentCount = attendance.filter(a => new Date(a.scanned_at) > thirtyDaysAgo).length
                 return recentCount >= 4 ? (
                   <div className="achievement-badge" title="4 services in 30 days">🕯️ Faithful Servant</div>
                 ) : null
               })()}
               {(() => {
                 const joinDate = new Date(profile.created_at)
                 const now = new Date()
                 // Earned if joined within the first 60 days of the project or just "Early" logic
                 return joinDate < new Date('2024-12-31') ? (
                    <div className="achievement-badge" title="Joined in 2024">🚀 Early Adopter</div>
                 ) : null
               })()}
               {attendance.length === 0 && (
                 <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No badges yet. Scan to earn!</p>
               )}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <style jsx>{`
            .achievement-badge {
              background: var(--accent-alpha);
              color: var(--accent-light);
              padding: 4px 10px;
              border-radius: 6px;
              font-size: 0.75rem;
              font-weight: 600;
              border: 1px solid rgba(108, 99, 255, 0.2);
              display: flex;
              align-items: center;
              gap: 4px;
            }
          `}</style>
          {/* Edit Form */}
          {editing && (
            <div className="card fade-in">
              <h3 style={{ marginBottom: 20 }}>Edit Profile</h3>
              {msg && <div className={`alert ${msg.startsWith('Error') ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 16 }}>{msg}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="tel" className="form-input" value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="grid-2" style={{ gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select className="form-input" value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Level</label>
                    <select className="form-input" value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))}>
                      <option value="">Select Level</option>
                      <option value="100L">100L</option>
                      <option value="200L">200L</option>
                      <option value="300L">300L</option>
                      <option value="400L">400L</option>
                      <option value="500L">500L</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input type="text" className="form-input" value={form.address}
                    onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                </div>
                <button onClick={saveProfile} className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving…</> : '💾 Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Attendance History */}
          <div className="card">
            <h3 style={{ marginBottom: 20 }}>Attendance History</h3>
            {attendance.length === 0 ? (
              <div className="text-center" style={{ padding: '40px 0', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
                <p>No attendance records yet.</p>
                <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Scan a QR code to record your first attendance!</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map(a => (
                      <tr key={a.id}>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {a.services?.name ?? 'Unknown Service'}
                        </td>
                        <td>{new Date(a.scanned_at).toLocaleDateString()}</td>
                        <td>{new Date(a.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td><span className="badge badge-present">✓ Present</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .profile-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
