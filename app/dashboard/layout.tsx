'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [name, setName] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('role, name')
        .eq('id', user.id)
        .single()
      if (data) { setRole(data.role); setName(data.name) }
    })
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const links = [
    { href: '/dashboard/profile', label: 'Profile', icon: '👤' },
    { href: '/dashboard/scan', label: 'Scan QR', icon: '📷' },
    ...(role === 'admin' ? [
      { href: '/admin', label: 'Admin', icon: '⚙️' },
    ] : []),
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav className="nav">
        <Link href="/" className="nav-logo">
          <div className="logo-icon">✝️</div>
          <span>ChurchAttend</span>
        </Link>

        <div className="nav-links">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link ${pathname === l.href ? 'active' : ''}`}
            >
              <span>{l.icon}</span>
              <span>{l.label}</span>
            </Link>
          ))}

          <div style={{
            width: 1, height: 24, background: 'var(--border)', margin: '0 8px'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {name && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Hi, {name.split(' ')[0]}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="btn btn-ghost btn-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  )
}
