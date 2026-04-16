'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ScanPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'scanning' | 'found' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const scannerRef = useRef<unknown>(null)
  const [Html5Qrcode, setHtml5Qrcode] = useState<unknown>(null)

  useEffect(() => {
    // Dynamically import html5-qrcode (browser-only)
    import('html5-qrcode').then(mod => {
      setHtml5Qrcode(() => mod.Html5Qrcode)
    })
    return () => {
      stopScanner()
    }
  }, [])

  async function startScanner() {
    if (!Html5Qrcode) return
    setStatus('scanning')
    setErrorMsg('')

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scanner = new (Html5Qrcode as any)('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          // QR code detected
          stopScanner()
          setStatus('found')
          handleQRResult(decodedText)
        },
        (_error: unknown) => { /* quiet scan failures */ }
      )
    } catch (err) {
      setStatus('error')
      setErrorMsg('Could not access camera. Please allow camera permissions.')
      console.error(err)
    }
  }

  async function stopScanner() {
    if (scannerRef.current) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (scannerRef.current as any).stop()
      } catch { /* ignore */ }
      scannerRef.current = null
    }
  }

  function handleQRResult(decodedText: string) {
    // Extract token from URL like https://domain.com/attend/<token>
    try {
      const url = new URL(decodedText)
      const token = url.pathname.split('/attend/')[1]
      if (token) {
        router.push(`/attend/${token}`)
      } else {
        setStatus('error')
        setErrorMsg('Invalid QR code. This is not a ChurchAttend QR code.')
      }
    } catch {
      // Try direct token
      if (decodedText.length > 0) {
        router.push(`/attend/${decodedText}`)
      } else {
        setStatus('error')
        setErrorMsg('Could not read QR code.')
      }
    }
  }

  return (
    <div className="layout-container" style={{ maxWidth: 600 }}>
      <div className="page-header">
        <h1 className="page-title">Scan QR Code</h1>
        <p className="page-subtitle">Point your camera at the service QR code to mark your attendance</p>
      </div>

      <div className="card text-center">
        {/* QR reader container */}
        <div
          id="qr-reader"
          style={{
            width: '100%',
            maxWidth: 340,
            margin: '0 auto',
            borderRadius: 12,
            overflow: 'hidden',
            background: 'var(--bg-secondary)',
            minHeight: status === 'scanning' ? 340 : 0,
            transition: 'min-height 0.3s ease'
          }}
        />

        {/* Idle state */}
        {status === 'idle' && (
          <div style={{ padding: '40px 0' }}>
            <div style={{ fontSize: '5rem', marginBottom: 16 }}>📷</div>
            <h3 style={{ marginBottom: 8 }}>Ready to Scan</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: '0.9rem' }}>
              We&apos;ll use your camera to scan the church service QR code.
            </p>
            <button onClick={startScanner} className="btn btn-primary btn-lg">
              Start Camera
            </button>
          </div>
        )}

        {/* Scanning state */}
        {status === 'scanning' && (
          <div style={{ marginTop: 20 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 12 }}>
              📍 Scanning… Hold steady over the QR code
            </p>
            <button onClick={() => { stopScanner(); setStatus('idle') }} className="btn btn-ghost btn-sm">
              Cancel
            </button>
          </div>
        )}

        {/* Found */}
        {status === 'found' && (
          <div style={{ padding: '40px 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: 12 }}>✅</div>
            <h3>QR Code Detected!</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: '0.9rem' }}>Redirecting to attendance check-in…</p>
            <div className="spinner" style={{ margin: '16px auto 0' }} />
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div style={{ padding: '40px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>❌</div>
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              {errorMsg}
            </div>
            <button onClick={() => setStatus('idle')} className="btn btn-primary">
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: '1rem', marginBottom: 14 }}>How it works</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            'Tap "Start Camera" to activate your device camera',
            'Point the camera at the QR code displayed at service',
            'Your attendance will be automatically recorded',
            'Works offline — records sync when you reconnect',
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                minWidth: 24, height: 24,
                background: 'var(--accent)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700
              }}>{i + 1}</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingTop: 2 }}>{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
