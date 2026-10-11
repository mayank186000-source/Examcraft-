// Guest User Persistent Tracking Utility
// Assigns sequential persistent IDs (e.g., Guest-001, Guest-002) per device.
// If the same device returns, it re-uses the existing Guest ID.

const GUEST_ID_KEY = 'examidea_persistent_guest_id';
const GUEST_COUNTER_KEY = 'examidea_guest_counter';

/**
 * Retrieves or creates a unique sequential Guest ID for the current device.
 * Example outputs: "Guest-001", "Guest-002", "Guest-003"
 */
export function getOrCreateGuestId(): string {
  try {
    // 1. Check if this device already has an assigned Guest ID
    const existingId = localStorage.getItem(GUEST_ID_KEY);
    if (existingId && existingId.startsWith('Guest-')) {
      return existingId;
    }

    // 2. Otherwise increment global counter
    let currentCounter = 1;
    const storedCounter = localStorage.getItem(GUEST_COUNTER_KEY);
    if (storedCounter) {
      const parsed = parseInt(storedCounter, 10);
      if (!isNaN(parsed) && parsed > 0) {
        currentCounter = parsed + 1;
      }
    }

    // Format as Guest-001, Guest-002, Guest-010, etc.
    const paddedNum = String(currentCounter).padStart(3, '0');
    const newGuestId = `Guest-${paddedNum}`;

    // Save back to localStorage
    localStorage.setItem(GUEST_ID_KEY, newGuestId);
    localStorage.setItem(GUEST_COUNTER_KEY, currentCounter.toString());

    return newGuestId;
  } catch {
    return 'Guest-001';
  }
}

/**
 * Returns the current device's Guest Email identifier, e.g. "guest-001@examidea.internal"
 */
export function getOrCreateGuestEmail(): string {
  const guestId = getOrCreateGuestId();
  return `${guestId.toLowerCase()}@examidea.internal`;
}

/**
 * Normalizes raw email/user names to clear Guest-XXX titles if they are guest users.
 */
export function formatGuestName(rawEmail?: string | null, rawName?: string | null): string {
  const email = (rawEmail || '').toLowerCase().trim();
  const name = (rawName || '').trim();

  // If email contains a specific guest ID like guest-005@
  const match = email.match(/guest-(\d+)/i) || name.match(/guest-(\d+)/i);
  if (match && match[1]) {
    const num = match[1].padStart(3, '0');
    return `Guest-${num}`;
  }

  // If it's a generic guest without number
  if (!email || email === 'guest@examcraft.internal' || email === 'unknown@guest' || email.includes('guest') || name.toLowerCase().includes('guest')) {
    // Fallback to current device's guest ID if applicable, or generic Guest-001
    const currentDeviceGuest = localStorage.getItem(GUEST_ID_KEY) || 'Guest-001';
    return currentDeviceGuest;
  }

  return name || (email ? email.split('@')[0] : 'Student');
}
