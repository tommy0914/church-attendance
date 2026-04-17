'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts'
import { Users, CheckCircle, TrendingUp, Filter } from 'lucide-react'

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics() {
    const supabase = createClient()
    
    // 1. Fetch all members for demographics
    const { data: profiles } = await supabase
      .from('profiles')
      .select('gender, level, created_at')

    // 2. Fetch recent attendance for trends
    const { data: attendance } = await supabase
      .from('attendance')
      .select('scanned_at, service_id, services(name)')
      .order('scanned_at', { ascending: true })

    if (profiles && attendance) {
      // Process Gender Data
      const genderMap = profiles.reduce((acc: any, p: any) => {
        const g = p.gender || 'Unknown'
        acc[g] = (acc[g] || 0) + 1
        return acc
      }, {})
      const genderData = Object.keys(genderMap).map(name => ({ name, value: genderMap[name] }))

      // Process Level Data
      const levelMap = profiles.reduce((acc: any, p: any) => {
        const l = p.level || 'Other'
        acc[l] = (acc[l] || 0) + 1
        return acc
      }, {})
      const levelData = Object.keys(levelMap).map(name => ({ name, count: levelMap[name] }))
        .sort((a,b) => a.name.localeCompare(b.name))

      // Process Attendance Trend (Last 10 services or time-based)
      // Group by date or service name
      const serviceAttendance = attendance.reduce((acc: any, curr: any) => {
        const sName = curr.services?.name || 'Unknown'
        acc[sName] = (acc[sName] || 0) + 1
        return acc
      }, {})
      const trendData = Object.keys(serviceAttendance).map(name => ({
        name,
        count: serviceAttendance[name]
      })).slice(-8) // Take last 8 services

      setData({
        genderData,
        levelData,
        trendData,
        totalMembers: profiles.length,
        totalAttendance: attendance.length
      })
    }
    setLoading(false)
  }

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']

  if (loading) return (
    <div className="page-center">
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  )

  return (
    <div className="layout-container fade-in">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="page-title">Community Insights</h1>
          <p className="page-subtitle">Visualizing attendance patterns and member demographics</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 32 }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ padding: 12, background: 'var(--accent-alpha)', borderRadius: 12, color: 'var(--accent)' }}>
            <Users size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Members</p>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{data.totalMembers}</h2>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ padding: 12, background: 'rgba(16, 185, 129, 0.15)', borderRadius: 12, color: '#10b981' }}>
            <CheckCircle size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Check-ins</p>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{data.totalAttendance}</h2>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ padding: 12, background: 'rgba(245, 158, 11, 0.15)', borderRadius: 12, color: '#f59e0b' }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Growth Rate</p>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>+{(data.totalMembers / 30).toFixed(1)} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>/mo</span></h2>
          </div>
        </div>
      </div>

      <div className="grid-stack" style={{ marginBottom: 24 }}>
        {/* Attendance Trend Chart */}
        <div className="card" style={{ minHeight: 400 }}>
          <h3 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="var(--accent)" /> Attendance Trend
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={data.trendData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)' }}
                itemStyle={{ color: 'var(--accent-light)' }}
              />
              <Area type="monotone" dataKey="count" stroke="var(--accent)" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Distribution */}
        <div className="card" style={{ height: 400 }}>
          <h3 style={{ marginBottom: 12 }}>Gender Distribution</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={data.genderData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.genderData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        {/* Level Distribution */}
        <div className="card" style={{ height: 350 }}>
          <h3 style={{ marginBottom: 24 }}>Membership by Academic Level</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={data.levelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                 contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)' }}
              />
              <Bar dataKey="count" fill="var(--accent)" radius={[6, 6, 0, 0]} barSize={40}>
                {data.levelData.map((entry: any, index: number) => (
                   <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style jsx>{`
        .card {
          border: 1px solid var(--border);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  )
}
