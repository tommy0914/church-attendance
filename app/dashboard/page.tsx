'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Megaphone, MessageSquare, Camera, Heart, Sparkles } from 'lucide-react'

export default function MemberDashboard() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [prayer, setPrayer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [msg, setMsg] = useState('')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
      if (profile) setUserName(profile.name.split(' ')[0])
    }

    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(5)
    setAnnouncements(data || [])
  }

  async function submitPrayer(e: React.FormEvent) {
    e.preventDefault()
    if (!prayer.trim()) return
    setIsSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { error } = await supabase.from('prayer_requests').insert({
        user_id: user.id,
        content: prayer
      })
      if (!error) {
        setPrayer('')
        setMsg('🙏 Your prayer request has been sent to the church leaders.')
        setTimeout(() => setMsg(''), 5000)
      }
    }
    setIsSubmitting(false)
  }

  return (
    <div className="layout-container fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          Welcome back, {userName}! <Sparkles color="var(--accent)" />
        </h1>
        <p className="page-subtitle">Stay connected with your church community</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
        
        {/* Main Content: Announcements */}
        <div>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
             <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
               <Megaphone size={20} color="var(--accent)" /> Church Announcements
             </h3>
             <Link href="/dashboard/scan" className="btn btn-primary btn-sm" style={{ gap: 8 }}>
               <Camera size={16} /> Scan Attendance
             </Link>
           </div>

           {announcements.length === 0 ? (
             <div className="card text-center" style={{ padding: 40, borderStyle: 'dashed' }}>
               <p style={{ color: 'var(--text-muted)' }}>No announcements at the moment. Check back later!</p>
             </div>
           ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
               {announcements.map(a => (
                 <div key={a.id} className="card" style={{ 
                   background: a.priority === 'high' ? 'linear-gradient(to right, var(--bg-secondary), rgba(239, 68, 68, 0.05))' : 'var(--bg-secondary)',
                   borderLeft: a.priority === 'high' ? '4px solid var(--error)' : '4px solid var(--accent)'
                 }}>
                   <p style={{ fontSize: '1rem', lineHeight: 1.6, marginBottom: 8 }}>{a.content}</p>
                   <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                     {new Date(a.created_at).toLocaleDateString()}
                   </span>
                 </div>
               ))}
             </div>
           )}
        </div>

        {/* Sidebar: Prayer Room */}
        <aside>
          <div className="card" style={{ background: 'var(--accent-alpha)', borderColor: 'var(--accent-light)' }}>
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Heart size={20} color="var(--accent)" /> Prayer Room
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
              Share your needs with us. Our prayer team is standing by to support you.
            </p>
            
            {msg && <div className="alert alert-success" style={{ marginBottom: 16, fontSize: '0.85rem' }}>{msg}</div>}

            <form onSubmit={submitPrayer} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <textarea 
                className="form-input" 
                style={{ height: 120, background: 'var(--bg-primary)', resize: 'none', padding: 12 }}
                placeholder="What can we pray for today?"
                value={prayer}
                onChange={e => setPrayer(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Prayer Request'}
              </button>
            </form>
          </div>

          <div className="card" style={{ marginTop: 24, padding: 20, textAlign: 'center' }}>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>Need to update your info?</p>
             <Link href="/dashboard/profile" className="btn btn-ghost btn-sm" style={{ width: '100%' }}>
               Edit My Profile
             </Link>
          </div>
        </aside>

      </div>
    </div>
  )
}
