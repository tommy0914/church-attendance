'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Stats {
  totalMembers: number
  totalServices: number
  totalAttendance: number
  recentAttendance: { name: string; service: string; scanned_at: string }[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [
        { count: members },
        { count: services },
        { count: attendance },
        { data: recent }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('services').select('*', { count: 'exact', head: true }),
        supabase.from('attendance').select('*', { count: 'exact', head: true }),
        supabase
          .from('attendance')
          .select('scanned_at, profiles(name), services(name)')
          .order('scanned_at', { ascending: false })
          .limit(8)
      ])

      setStats({
        totalMembers: members ?? 0,
        totalServices: services ?? 0,
        totalAttendance: attendance ?? 0,
        recentAttendance: (recent ?? []).map((r: any) => ({
          name: r.profiles?.name ?? 'Unknown',
          service: r.services?.name ?? 'Unknown',
          scanned_at: r.scanned_at,
        }))
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="layout-container">
      <div className="page-header">
        <div style={{ height: 32, width: 200, borderRadius: 8, background: 'var(--bg-secondary)', animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
        <div style={{ height: 18, width: 280, borderRadius: 6, background: 'var(--bg-secondary)', marginTop: 8, animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
      </div>
      <div className="grid-3" style={{ marginBottom: 28 }}>
        {[1,2,3].map(i => (
          <div key={i} className="stat-card" style={{ minHeight: 110 }}>
            <div style={{ height: 32, width: 32, borderRadius: 8, background: 'var(--bg-secondary)', animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
            <div style={{ height: 28, width: 60, borderRadius: 6, background: 'var(--bg-secondary)', marginTop: 8, animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
          </div>
        ))}
      </div>
      <div className="card" style={{ height: 200 }} />
    </div>
  )
  if (!stats) return null

  return (
    <div className="layout-container">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Overview of your church attendance system</p>
      </div>

      {/* Stat cards */}
      <div className="grid-3" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Members', value: stats.totalMembers, icon: '👥', href: '/admin/members' },
          { label: 'Services Created', value: stats.totalServices, icon: '🗓️', href: '/admin/services' },
          { label: 'Attendance Records', value: stats.totalAttendance, icon: '✅', href: null },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: '1.8rem' }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            {s.href && (
              <Link href={s.href} style={{ fontSize: '0.8rem', color: 'var(--accent-light)', marginTop: 4 }}>
                View all →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid-2" style={{ marginBottom: 28 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: '1rem' }}>⚡ Quick Actions</h3>
          <Link href="/admin/services" className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
            🗓️ Create New Service
          </Link>
          <Link href="/admin/services" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
            📱 Generate QR Code
          </Link>
          <Link href="/admin/members" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
            👥 View All Members
          </Link>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>📈 Attendance Rate</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 80, height: 80,
              borderRadius: '50%',
              background: `conic-gradient(var(--accent) ${stats.totalMembers ? Math.min(100, Math.round((stats.totalAttendance / (stats.totalMembers * Math.max(stats.totalServices, 1))) * 100)) : 0}%, var(--bg-secondary) 0%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative'
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-card)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.9rem', fontWeight: 700
              }}>
                {stats.totalMembers
                  ? Math.min(100, Math.round((stats.totalAttendance / (stats.totalMembers * Math.max(stats.totalServices, 1))) * 100))
                  : 0}%
              </div>
            </div>
            <div>
              <p style={{ fontWeight: 600 }}>Average Attendance</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {stats.totalAttendance} records across {stats.totalServices} services
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent attendance */}
      <div className="card">
        <h3 style={{ marginBottom: 20 }}>Recent Attendance</h3>
        {stats.recentAttendance.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No records yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Service</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentAttendance.map((r, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.name}</td>
                    <td>{r.service}</td>
                    <td>{new Date(r.scanned_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
