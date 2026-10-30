'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Megaphone, Camera, Heart, Sparkles, CalendarDays, Bell } from 'lucide-react'

interface UpcomingService {
  id: string
  name: string
  description: string | null
  start_time: string
  end_time: string
}

interface Announcement {
  id: string
  content: string
  priority: string | null
  created_at: string
}

interface RecentAttendance {
  id: string
  serviceName: string
  scanned_at: string
}

function escapeCalendarText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\n|\r/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function formatCalendarDate(value: Date) {
  return value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export default function MemberDashboard() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [upcomingServices, setUpcomingServices] = useState<UpcomingService[]>([])
  const [servicesLoading, setServicesLoading] = useState(true)
  const [servicesError, setServicesError] = useState('')
  const [userId, setUserId] = useState('')
  const [monthlyAttendance, setMonthlyAttendance] = useState(0)
  const [recentAttendance, setRecentAttendance] = useState<RecentAttendance[]>([])
  const [attendanceLoading, setAttendanceLoading] = useState(true)
  const [attendanceError, setAttendanceError] = useState('')
  const [attendanceGoal, setAttendanceGoal] = useState(4)
  const [goalError, setGoalError] = useState('')
  const [prayer, setPrayer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [msg, setMsg] = useState('')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setServicesLoading(false)
        setAttendanceLoading(false)
        return
      }

      setUserId(user.id)
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
      if (profile) setUserName(profile.name.split(' ')[0])

      try {
        const savedGoal = Number(localStorage.getItem(`monthly-attendance-goal:${user.id}`))
        if (Number.isInteger(savedGoal) && savedGoal >= 1 && savedGoal <= 12) {
          setAttendanceGoal(savedGoal)
        }
      } catch (error) {
        console.error('Failed to load attendance goal:', error)
        setGoalError('Your goal could not be loaded from this device.')
      }

      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const [monthlyResult, recentResult] = await Promise.all([
        supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('scanned_at', monthStart.toISOString())
          .lt('scanned_at', nextMonthStart.toISOString()),
        supabase
          .from('attendance')
          .select('id, scanned_at, services(name)')
          .eq('user_id', user.id)
          .order('scanned_at', { ascending: false })
          .limit(3),
      ])

      if (monthlyResult.error || recentResult.error) {
        console.error('Failed to load attendance progress:', monthlyResult.error ?? recentResult.error)
        setAttendanceError('Your attendance progress could not be loaded. Please try again later.')
      } else {
        setMonthlyAttendance(monthlyResult.count ?? 0)
        setRecentAttendance((recentResult.data ?? []).map((record: {
          id: string
          scanned_at: string
          services: { name: string } | { name: string }[] | null
        }) => ({
          id: record.id,
          scanned_at: record.scanned_at,
          serviceName: Array.isArray(record.services)
            ? record.services[0]?.name ?? 'Church service'
            : record.services?.name ?? 'Church service',
        })))
      }
      setAttendanceLoading(false)

      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('id, content, priority, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
      setAnnouncements(announcementsData ?? [])

      const { data: services, error } = await supabase
        .from('services')
        .select('id, name, description, start_time, end_time')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(3)

      if (error) {
        setServicesError('Upcoming events could not be loaded. Please try again later.')
        console.error('Failed to load upcoming services:', error)
      } else {
        setUpcomingServices(services ?? [])
      }
      setServicesLoading(false)
    }

    void loadData()
  }, [])

  function updateAttendanceGoal(value: string) {
    const goal = Number(value)
    if (!userId || !Number.isInteger(goal) || goal < 1 || goal > 12) return

    try {
      localStorage.setItem(`monthly-attendance-goal:${userId}`, String(goal))
      setAttendanceGoal(goal)
      setGoalError('')
    } catch (error) {
      console.error('Failed to save attendance goal:', error)
      setGoalError('Your goal could not be saved on this device.')
    }
  }

  function addCalendarReminder(service: UpcomingService) {
    const start = new Date(service.start_time)
    const end = new Date(service.end_time)
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      setServicesError('This event has an invalid date and cannot be added to your calendar.')
      return
    }

    const description = service.description ? `DESCRIPTION:${escapeCalendarText(service.description)}\r\n` : ''
    const content = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ChurchAttend//Upcoming Events//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${service.id}@churchattend`,
      `DTSTAMP:${formatCalendarDate(new Date())}`,
      `DTSTART:${formatCalendarDate(start)}`,
      `DTEND:${formatCalendarDate(end)}`,
      `SUMMARY:${escapeCalendarText(service.name)}`,
      description.trimEnd(),
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeCalendarText(`Reminder: ${service.name} starts in 30 minutes`)}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n') + '\r\n'

    const file = new Blob([content], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = `${service.name.replace(/[^a-z0-9_-]+/gi, '_') || 'church-event'}.ics`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
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
        <p className="page-subtitle">Welcome to the Faith Baptist Church Youth Portal</p>
      </div>

      <section className="card" aria-labelledby="upcoming-events-title" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <h2 id="upcoming-events-title" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.1rem' }}>
            <CalendarDays size={20} color="var(--accent)" /> Upcoming Events
          </h2>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <Bell size={15} /> Calendar reminder included
          </span>
        </div>

        {servicesLoading ? (
          <p role="status" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading upcoming events…</p>
        ) : servicesError ? (
          <p role="alert" style={{ color: 'var(--error)', fontSize: '0.9rem' }}>{servicesError}</p>
        ) : upcomingServices.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No upcoming events have been scheduled yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {upcomingServices.map(service => (
              <div key={service.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontSize: '0.98rem', marginBottom: 4 }}>{service.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {new Date(service.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  {service.description && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>{service.description}</p>
                  )}
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => addCalendarReminder(service)}>
                  <CalendarDays size={15} /> Add reminder
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card" aria-labelledby="attendance-progress-title" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <h2 id="attendance-progress-title" style={{ fontSize: '1.1rem', marginBottom: 4 }}>My Attendance Progress</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {new Date().toLocaleDateString([], { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <span className="form-label">Monthly goal</span>
            <select
              className="form-input"
              aria-label="Monthly attendance goal"
              value={attendanceGoal}
              onChange={event => updateAttendanceGoal(event.target.value)}
              style={{ width: 'auto', minWidth: 88, padding: '8px 10px' }}
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map(goal => (
                <option key={goal} value={goal}>{goal} {goal === 1 ? 'service' : 'services'}</option>
              ))}
            </select>
          </label>
        </div>

        {attendanceLoading ? (
          <p role="status" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading your attendance…</p>
        ) : attendanceError ? (
          <p role="alert" style={{ color: 'var(--error)', fontSize: '0.9rem' }}>{attendanceError}</p>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)' }}>{monthlyAttendance}</span>
              <span style={{ color: 'var(--text-secondary)' }}>of {attendanceGoal} services attended this month</span>
            </div>
            <div
              role="progressbar"
              aria-label="Monthly attendance goal progress"
              aria-valuemin={0}
              aria-valuemax={attendanceGoal}
              aria-valuenow={Math.min(monthlyAttendance, attendanceGoal)}
              style={{ height: 10, borderRadius: 999, overflow: 'hidden', background: 'var(--bg-primary)', marginBottom: 10 }}
            >
              <div style={{
                width: `${Math.min(100, (monthlyAttendance / attendanceGoal) * 100)}%`,
                height: '100%',
                borderRadius: 'inherit',
                background: 'linear-gradient(90deg, var(--accent), var(--teal))',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {monthlyAttendance >= attendanceGoal
                ? 'Goal reached — great work showing up this month!'
                : `${attendanceGoal - monthlyAttendance} ${attendanceGoal - monthlyAttendance === 1 ? 'more service' : 'more services'} to reach your goal.`}
            </p>
            {goalError && <p role="status" style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: 6 }}>{goalError}</p>}

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: 10 }}>Recent attendance</h3>
              {recentAttendance.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No attendance records yet. Check in at the next service to start your progress.</p>
              ) : (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recentAttendance.map(record => (
                    <li key={record.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <span>{record.serviceName}</span>
                      <time dateTime={record.scanned_at}>{new Date(record.scanned_at).toLocaleDateString([], { dateStyle: 'medium' })}</time>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 12 }}>Your monthly goal is saved on this device.</p>
          </>
        )}
      </section>

      <div className="grid-stack">
        
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
