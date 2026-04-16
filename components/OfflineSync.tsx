'use client'
import { useEffect } from 'react'
import { syncOfflineRecords } from '@/lib/offline'

export default function OfflineSync() {
  useEffect(() => {
    // Run sync on load/refresh
    syncOfflineRecords()

    // Listen for online/offline events
    function handleOnline() {
      console.log('[OfflineSync] Browser is back online. Attempting sync…')
      syncOfflineRecords()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline)
      }
    }
  }, [])

  return null
}
