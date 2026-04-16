'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Member {
  id: string
  name: string
  phone: string | null
  address: string | null
  role: string
  created_at: string
  attendance_count?: number
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { loadMembers() }, [])

  async function loadMembers() {
    const supabase = createClient()
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, phone, address, role, created_at')
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

  async function toggleAdmin(member: Member) {
    const newRole = member.role === 'admin' ? 'member' : 'admin'
    if (!confirm(`${newRole === 'admin' ? 'Promote' : 'Demote'} ${member.name} to ${newRole}?`)) return
    const supabase = createClient()
    await supabase.from('profiles').update({ role: newRole }).eq('id', member.id)
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m))
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
          style={{ width: 260 }}
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
                  <th>Address</th>
                  <th>Role</th>
                  <th>Services</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: m.role === 'admin' ? 'var(--accent)' : 'var(--bg-secondary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.85rem', fontWeight: 700, border: '1px solid var(--border)'
                        }}>{m.name[0]}</div>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{m.name}</span>
                      </div>
                    </td>
                    <td>{m.phone ?? '—'}</td>
                    <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={m.address ?? ''}>{m.address ?? '—'}</td>
                    <td><span className={`badge ${m.role === 'admin' ? 'badge-admin' : 'badge-member'}`}>{m.role}</span></td>
                    <td>{m.attendance_count}</td>
                    <td>{new Date(m.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => toggleAdmin(m)}
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
    </div>
  )
}
