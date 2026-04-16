'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import QRCode from 'qrcode'
import Link from 'next/link'

interface Service {
  id: string
  name: string
  description: string | null
  start_time: string
  end_time: string
  qr_token: string
}

interface AttendanceStat {
  count: number
  names: string[]
}

export default function QRDisplayPage() {
  const { serviceId } = useParams<{ serviceId: string }>()
  const [service, setService] = useState<Service | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [stat, setStat] = useState<AttendanceStat>({ count: 0, names: [] })
  const [loading, setLoading] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    loadService()
  }, [serviceId])

  async function loadService() {
    const supabase = createClient()
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single()

    if (data) {
      setService(data)
      // Generate QR code
      const url = `${window.location.origin}/attend/${data.qr_token}`
      const dataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: { dark: '#1a1a28', light: '#ffffff' },
        errorCorrectionLevel: 'H'
      })
      setQrDataUrl(dataUrl)

      // Load attendance for this service
      const { data: attendees } = await supabase
        .from('attendance')
        .select('profiles(name)')
        .eq('service_id', serviceId)

      setStat({
        count: attendees?.length ?? 0,
        names: attendees?.map((a: any) => a.profiles?.name ?? '').filter(Boolean) ?? []
      })
    }
    setLoading(false)
  }

  function downloadQR() {
    const link = document.createElement('a')
    link.download = `qr-${service?.name ?? 'service'}.png`
    link.href = qrDataUrl
    link.click()
  }

  if (loading) return <div className="page-center"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
  if (!service) return (
    <div className="page-center">
      <div className="card text-center" style={{ maxWidth: 360 }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>❌</div>
        <h3>Service not found</h3>
        <Link href="/admin/services" className="btn btn-primary" style={{ marginTop: 20 }}>← Back to Services</Link>
      </div>
    </div>
  )

  return (
    <div className="layout-container" style={{ maxWidth: 800 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Link href="/admin/services" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            ← Back to Services
          </Link>
          <h1 className="page-title">{service.name}</h1>
          <p className="page-subtitle">
            {new Date(service.start_time).toLocaleString()} — {new Date(service.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
        {/* QR Code display */}
        <div className="card text-center">
          <h3 style={{ marginBottom: 6 }}>Service QR Code</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 20 }}>Display this on screen or print for members to scan</p>

          {qrDataUrl && (
            <div style={{
              background: 'white',
              padding: 20,
              borderRadius: 16,
              display: 'inline-block',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              animation: 'pulse-glow 3s ease-in-out infinite'
            }}>
              <img src={qrDataUrl} alt="QR Code" style={{ width: 240, height: 240, display: 'block' }} />
            </div>
          )}

          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 16, marginBottom: 20 }}>
            Token: <code style={{ color: 'var(--accent-light)' }}>{service.qr_token.slice(0, 12)}…</code>
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={downloadQR} className="btn btn-primary btn-sm">
              ⬇️ Download PNG
            </button>
            <button
              onClick={() => window.print()}
              className="btn btn-secondary btn-sm"
            >
              🖨️ Print
            </button>
          </div>
        </div>

        {/* Attendance panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="stat-card">
            <div style={{ fontSize: '2rem' }}>✅</div>
            <div className="stat-value">{stat.count}</div>
            <div className="stat-label">Members Checked In</div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '0.95rem', marginBottom: 14 }}>Attendees</h3>
            {stat.names.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '16px 0' }}>
                No one has scanned in yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                {stat.names.map((name, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 8
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.85rem', fontWeight: 700
                    }}>{name[0]}</div>
                    <span style={{ fontSize: '0.875rem' }}>{name}</span>
                    <span className="badge badge-present" style={{ marginLeft: 'auto' }}>✓</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* live refresh */}
          <button onClick={loadService} className="btn btn-ghost btn-sm">
            🔄 Refresh Attendance
          </button>
        </div>
      </div>
    </div>
  )
}
