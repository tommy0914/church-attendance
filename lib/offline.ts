import { createClient } from './supabase/client';

export async function syncOfflineRecords() {
  if (typeof window === 'undefined') return;

  const pendingJSON = localStorage.getItem('pending_attendance');
  if (!pendingJSON) return;

  try {
    const pending = JSON.parse(pendingJSON);
    if (!Array.isArray(pending) || pending.length === 0) return;

    console.log(`[OfflineSync] Found ${pending.length} pending records. Syncing…`);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return; // Need auth to sync

    const successfulIndices: number[] = [];

    for (let i = 0; i < pending.length; i++) {
      const record = pending[i];
      // Attempt to record attendance for this record
      const { error } = await supabase
        .from('attendance')
        .insert({
          user_id: record.userId,
          service_id: record.serviceId,
          scanned_at: record.scanned_at,
          synced_offline: true
        });

      // If success or duplicate (already synced), mark as successful
      if (!error || error.code === '23505') {
        successfulIndices.push(i);
      } else {
        console.error(`[OfflineSync] Failed to sync record ${i}:`, error.message);
      }
    }

    // Remove successfully synced records
    const remaining = pending.filter((_, i) => !successfulIndices.includes(i));
    if (remaining.length === 0) {
      localStorage.removeItem('pending_attendance');
      console.log('[OfflineSync] All records synced successfully.');
    } else {
      localStorage.setItem('pending_attendance', JSON.stringify(remaining));
      console.log(`[OfflineSync] ${remaining.length} records still pending.`);
    }
  } catch (err) {
    console.error('[OfflineSync] Error during sync:', err);
  }
}

/**
 * Hook to initialize offline listener
 */
export function useOfflineSync() {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', syncOfflineRecords);
  }
}
