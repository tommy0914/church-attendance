'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const links = [
    { href: '/admin', label: 'Dashboard', icon: '📊', exact: true },
    { href: '/admin/services', label: 'Services', icon: '🗓️' },
    { href: '/admin/services', label: 'QR Codes', icon: '📱', exact: false, highlight: true },
    { href: '/admin/members', label: 'Members', icon: '👥' },
  ]

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav className="nav">
        <Link href="/admin" className="nav-logo">
          <div className="logo-icon">✝️</div>
          <span>ChurchAttend <span style={{ color: 'var(--accent-light)', fontSize: '0.75rem', fontWeight: 600 }}>Admin</span></span>
        </Link>

        <div className="nav-links">
          {links.map(l => (
            <Link
              key={`${l.label}-${l.href}`}
              href={l.href}
              className={`nav-link ${isActive(l.href, l.exact ?? false) ? 'active' : ''}`}
              style={l.highlight ? { color: 'var(--accent-light)', fontWeight: 600, background: 'var(--accent-alpha)' } : {}}
            >
              <span>{l.icon}</span>
              <span>{l.label}</span>
            </Link>
          ))}

          <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 8px' }} />

          <Link href="/dashboard/profile" className="nav-link">
            👤 <span>My Profile</span>
          </Link>

          <button onClick={handleSignOut} className="btn btn-ghost btn-sm">
            Sign Out
          </button>
        </div>
      </nav>

      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  )
}
