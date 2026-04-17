'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Megaphone, MessageSquare, Trash2, Check, Clock } from 'lucide-react'

export default function CommunicationPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [prayerRequests, setPrayerRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newAnnouncement, setNewAnnouncement] = useState('')
  const [priority, setPriority] = useState('normal')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    const [anc, prayer] = await Promise.all([
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('prayer_requests').select('*, profiles(name)').order('created_at', { ascending: false })
    ])
    setAnnouncements(anc.data || [])
    setPrayerRequests(prayer.data || [])
    setLoading(false)
  }

  async function postAnnouncement(e: React.FormEvent) {
    e.preventDefault()
    if (!newAnnouncement.trim()) return
    const supabase = createClient()
    const { error } = await supabase.from('announcements').insert({
      content: newAnnouncement,
      priority
    })
    if (!error) {
      setNewAnnouncement('')
      loadData()
    }
  }

  async function deleteAnnouncement(id: string) {
    const supabase = createClient()
    await supabase.from('announcements').delete().eq('id', id)
    loadData()
  }

  async function markAsPrayed(id: string) {
    const supabase = createClient()
    await supabase.from('prayer_requests').update({ status: 'prayed' }).eq('id', id)
    loadData()
  }

  if (loading) return (
    <div className="page-center">
      <div className="spinner" />
    </div>
  )

  return (
    <div className="layout-container fade-in">
      <div className="page-header">
        <h1 className="page-title">Community & Communication</h1>
        <p className="page-subtitle">Manage announcements and respond to prayer requests</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        
        {/* Announcements Section */}
        <section>
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Megaphone size={20} color="var(--accent)" /> Post New Announcement
            </h3>
            <form onSubmit={postAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <textarea 
                className="form-input" 
                style={{ height: 100, padding: 12, resize: 'none' }}
                placeholder="Type your message to the church family..."
                value={newAnnouncement}
                onChange={e => setNewAnnouncement(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <select className="form-input" style={{ width: 'auto' }} value={priority} onChange={e => setPriority(e.target.value)}>
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority 🚨</option>
                </select>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Post Announcement
                </button>
              </div>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 8 }}>Past Announcements</h4>
            {announcements.length === 0 ? (
              <p className="text-center" style={{ color: 'var(--text-muted)', padding: 20 }}>No announcements yet.</p>
            ) : announcements.map(a => (
              <div key={a.id} className="card" style={{ borderLeft: a.priority === 'high' ? '4px solid var(--error)' : '4px solid var(--accent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.5, flex: 1 }}>{a.content}</p>
                  <button onClick={() => deleteAnnouncement(a.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  {new Date(a.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Prayer Requests Section */}
        <section>
          <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <MessageSquare size={20} color="var(--accent)" /> Prayer Requests
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {prayerRequests.length === 0 ? (
              <div className="card text-center" style={{ padding: 40, borderStyle: 'dashed' }}>
                <p style={{ color: 'var(--text-muted)' }}>No prayer requests submitted yet.</p>
              </div>
            ) : prayerRequests.map(p => (
              <div key={p.id} className={`card ${p.status === 'prayed' ? 'opacity-50' : ''}`} style={{ transition: '0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h5 style={{ fontWeight: 600 }}>{p.profiles?.name || 'Anonymous Member'}</h5>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {new Date(p.created_at).toLocaleString()}
                    </p>
                  </div>
                  {p.status === 'pending' ? (
                    <button onClick={() => markAsPrayed(p.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--accent)' }}>
                      <Check size={16} /> Mark as Prayed
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                       🙏 Prayed
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.9rem', fontStyle: 'italic', background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 8 }}>
                  "{p.content}"
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>

      <style jsx>{`
        .opacity-50 {
          opacity: 0.6;
          filter: grayscale(0.5);
        }
      `}</style>
    </div>
  )
}
