'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Member {
  id: string
  name: string
  phone: string | null
  address: string | null
  avatar_url: string | null
  gender: string | null
  level: string | null
  role: string
  created_at: string
  attendance_count?: number
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [attendanceHistory, setAttendanceHistory] = useState<{name: string, date: string}[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [availableServices, setAvailableServices] = useState<{id: string, name: string}[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [marking, setMarking] = useState(false)

  useEffect(() => { 
    loadMembers() 
    loadAvailableServices()
  }, [])

  async function loadAvailableServices() {
    const supabase = createClient()
    const { data } = await supabase
      .from('services')
      .select('id, name')
      .order('start_time', { ascending: false })
      .limit(10)
    setAvailableServices(data || [])
    if (data && data.length > 0) setSelectedServiceId(data[0].id)
  }

  async function loadMembers() {
    const supabase = createClient()
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, phone, address, avatar_url, gender, level, role, created_at')
      .order('name')

    if (!profiles) { setLoading(false); return }

    // Get attendance counts for each member
    const counts = await Promise.all(
      profiles.map(p =>
        supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('user_id', p.id)
      )
    )

    setMembers(profiles.map((p, i) => ({ ...p, attendance_count: counts[i].count ?? 0 })))
    setLoading(false)
  }

  async function handleSelectMember(member: Member) {
    setSelectedMember(member)
    setAttendanceHistory([])
    loadAttendanceHistory(member.id)
  }

  async function loadAttendanceHistory(memberId: string) {
    setLoadingHistory(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('attendance')
      .select('scanned_at, services(name)')
      .eq('user_id', memberId)
      .order('scanned_at', { ascending: false })
      .limit(10)

    if (data) {
      setAttendanceHistory(data.map((a: any) => ({
        name: a.services?.name || 'Unknown Service',
        date: new Date(a.scanned_at).toLocaleDateString()
      })))
    } else {
      setAttendanceHistory([])
    }
    setLoadingHistory(false)
  }

  async function toggleAdmin(member: Member) {
    const newRole = member.role === 'admin' ? 'member' : 'admin'
    if (!confirm(`${newRole === 'admin' ? 'Promote' : 'Demote'} ${member.name} to ${newRole}?`)) return
    const supabase = createClient()
    await supabase.from('profiles').update({ role: newRole }).eq('id', member.id)
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m))
    if (selectedMember?.id === member.id) {
      setSelectedMember(prev => prev ? { ...prev, role: newRole } : null)
    }
  }

  async function markManualAttendance() {
    if (!selectedMember || !selectedServiceId) return
    setMarking(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('attendance')
      .insert({ user_id: selectedMember.id, service_id: selectedServiceId })

    if (error) {
      if (error.code === '23505') alert('This member is already marked present for this service.')
      else alert('Error: ' + error.message)
    } else {
      // Success - update local state
      setMembers(prev => prev.map(m => 
        m.id === selectedMember.id 
          ? { ...m, attendance_count: (m.attendance_count || 0) + 1 } 
          : m
      ))
      if (selectedMember.id) {
        setSelectedMember(prev => prev ? { ...prev, attendance_count: (prev.attendance_count || 0) + 1 } : null)
        await loadAttendanceHistory(selectedMember.id)
      }
      alert('Attendance marked successfully!')
    }
    setMarking(false)
  }

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.phone ?? '').includes(search)
  )

  return (
    <div className="layout-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Members</h1>
          <p className="page-subtitle">{members.length} registered members</p>
        </div>
        <input
          type="text"
          className="form-input"
          placeholder="🔍 Search by name or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: 260 }}
        />
      </div>

      {loading ? (
        <div className="text-center" style={{ padding: 60 }}>
          <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} />
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th className="hide-mobile">Address</th>
                  <th>Role</th>
                  <th>Services</th>
                  <th className="hide-mobile">Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr 
                    key={m.id} 
                    onClick={() => handleSelectMember(m)} 
                    style={{ cursor: 'pointer' }}
                    className="hover-row"
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: m.role === 'admin' ? 'var(--accent)' : 'var(--bg-secondary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.85rem', fontWeight: 700, border: '1px solid var(--border)',
                          overflow: 'hidden'
                        }}>
                          {m.avatar_url 
                            ? <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : m.name[0]
                          }
                        </div>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{m.name}</span>
                      </div>
                    </td>
                    <td>{m.phone ?? '—'}</td>
                    <td className="hide-mobile" style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={m.address ?? ''}>{m.address ?? '—'}</td>
                    <td><span className={`badge ${m.role === 'admin' ? 'badge-admin' : 'badge-member'}`}>{m.role}</span></td>
                    <td>{m.attendance_count}</td>
                    <td className="hide-mobile">{new Date(m.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleAdmin(m); }}
                        className={`btn btn-sm ${m.role === 'admin' ? 'btn-ghost' : 'btn-secondary'}`}
                      >
                        {m.role === 'admin' ? 'Demote' : 'Make Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>No members found.</p>
          )}
        </div>
      )}

      {/* Member Profile Modal (Flex Card) */}
      {selectedMember && (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', 
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20
    }} onClick={() => setSelectedMember(null)}>
      <div className="card fade-in" style={{ 
        maxWidth: 440, width: '100%', 
        position: 'relative', 
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedMember(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              ✕
            </button>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24, marginTop: 10 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: selectedMember.role === 'admin' ? 'var(--accent)' : 'var(--bg-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', fontWeight: 700, border: '4px solid var(--border)',
                marginBottom: 16, overflow: 'hidden'
              }}>
                {selectedMember.avatar_url 
                  ? <img src={selectedMember.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : selectedMember.name[0]
                }
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 4 }}>{selectedMember.name}</h2>
              <span className={`badge ${selectedMember.role === 'admin' ? 'badge-admin' : 'badge-member'}`}>
                {selectedMember.role.toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, marginBottom: 24 }}>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 2 }}>Phone Number</p>
                <p style={{ fontWeight: 500 }}>{selectedMember.phone || 'Not provided'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 2 }}>Address</p>
                <p style={{ fontWeight: 500, lineHeight: 1.4 }}>{selectedMember.address || 'Not provided'}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 2 }}>Gender</p>
                  <p style={{ fontWeight: 500 }}>{selectedMember.gender || 'Not specified'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 2 }}>Level</p>
                  <p style={{ fontWeight: 500 }}>{selectedMember.level || 'Not specified'}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 2 }}>Services Attended</p>
                  <p style={{ fontWeight: 500, color: 'var(--success)' }}>{selectedMember.attendance_count} ✅</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 2 }}>Member Since</p>
                  <p style={{ fontWeight: 500 }}>{new Date(selectedMember.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                Recent Attendance 
                <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>Last 10 services</span>
              </h3>
              {loadingHistory ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><div className="spinner" /></div>
              ) : attendanceHistory.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', background: 'var(--bg-secondary)', padding: 16, borderRadius: 8 }}>
                  No attendance records found yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {attendanceHistory.map((h, i) => (
                    <div key={i} style={{ 
                      display: 'flex', justifyContent: 'space-between', 
                      padding: '8px 12px', background: 'var(--bg-secondary)', 
                      borderRadius: 8, fontSize: '0.85rem' 
                    }}>
                      <span style={{ fontWeight: 500 }}>{h.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{h.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, marginBottom: 24, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: 12 }}>Mark Present Manually</h3>
              <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                <select 
                  className="form-input" 
                  style={{ fontSize: '0.85rem' }}
                  value={selectedServiceId}
                  onChange={e => setSelectedServiceId(e.target.value)}
                >
                  {availableServices.length === 0 ? (
                    <option value="">No services available</option>
                  ) : (
                    availableServices.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))
                  )}
                </select>
                <button 
                  onClick={markManualAttendance} 
                  className="btn btn-secondary" 
                  disabled={marking || !selectedServiceId}
                  style={{ width: '100%' }}
                >
                  {marking ? <span className="spinner" /> : '🤝 Mark as Present'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => toggleAdmin(selectedMember)} 
                className={`btn btn-full ${selectedMember.role === 'admin' ? 'btn-ghost' : 'btn-primary'}`}
              >
                {selectedMember.role === 'admin' ? 'Demote to Member' : '👑 Promote to Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
