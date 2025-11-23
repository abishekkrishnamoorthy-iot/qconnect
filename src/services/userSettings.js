import { ref, get, set, update } from 'firebase/database';
import { database } from '../firebase/config';

const nowIso = () => new Date().toISOString();

/**
 * Merge partial profile updates without overwriting the entire profile node.
 */
export const mergeUserProfile = async (uid, profileUpdates) => {
  if (!uid) {
    return { success: false, error: 'Missing user id' };
  }

  try {
    const profileRef = ref(database, `users/${uid}/profile`);
    await update(profileRef, {
      ...profileUpdates,
      updatedAt: nowIso(),
    });

    // Keep username/displayName in sync at root level for legacy consumers
    const rootUpdates = {};
    if (profileUpdates.username !== undefined) {
      rootUpdates.username = profileUpdates.username;
    }
    if (profileUpdates.displayName !== undefined) {
      rootUpdates.displayName = profileUpdates.displayName;
    } else if (profileUpdates.username !== undefined) {
      rootUpdates.displayName = profileUpdates.username;
    }

    if (Object.keys(rootUpdates).length > 0) {
      const userRef = ref(database, `users/${uid}`);
      await update(userRef, rootUpdates);
    }

    return { success: true };
  } catch (error) {
    console.error('Error merging user profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch consolidated user settings payload (profile + preferences + account).
 */
export const getUserSettings = async (uid) => {
  if (!uid) {
    return { success: false, error: 'Missing user id' };
  }

  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return { success: false, error: 'User not found' };
    }

    const data = snapshot.val();
    return {
      success: true,
      data: {
        profile: data.profile || {},
        preferences: data.preferences || {},
        account: data.account || {},
        notifications: data.notifications || {},
        auth: data.auth || {},
      }
    };
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return { success: false, error: error.message };
  }
};

const normalizeInterestKey = (interest) =>
  interest
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Fetch curated interest pool for suggestions.
 */
export const getInterestPool = async () => {
  try {
    const poolRef = ref(database, 'interestPool');
    const snapshot = await get(poolRef);

    if (!snapshot.exists()) {
      return { success: true, data: [] };
    }

    const raw = snapshot.val();
    if (Array.isArray(raw)) {
      return { success: true, data: raw };
    }

    if (typeof raw === 'object' && raw !== null) {
      return { success: true, data: Object.values(raw).filter(Boolean) };
    }

    return { success: true, data: [] };
  } catch (error) {
    console.error('Error fetching interest pool:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Add a single interest to the shared pool (idempotent).
 */
export const addInterestToPool = async (interest) => {
  if (!interest || !interest.trim()) {
    return { success: false, error: 'Interest cannot be empty' };
  }

  try {
    const key = normalizeInterestKey(interest);
    if (!key) {
      return { success: false, error: 'Invalid interest' };
    }

    const interestRef = ref(database, `interestPool/${key}`);
    await set(interestRef, interest.trim());
    return { success: true };
  } catch (error) {
    console.error('Error saving interest to pool:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark a user account for deletion and log the request centrally.
 */
export const requestAccountDeletion = async (uid, metadata = {}) => {
  if (!uid) {
    return { success: false, error: 'Missing user id' };
  }

  try {
    const updates = {};
    const timestamp = nowIso();

    updates[`accountDeletionRequests/${uid}`] = {
      uid,
      requestedAt: timestamp,
      status: 'pending',
      reason: metadata.reason || 'user_initiated',
      email: metadata.email || null,
    };

    updates[`users/${uid}/account/status`] = 'pending_deletion';
    updates[`users/${uid}/account/deletionRequestedAt`] = timestamp;

    await update(ref(database), updates);
    return { success: true };
  } catch (error) {
    console.error('Error requesting account deletion:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cancel a pending deletion request (admin or user recovery).
 */
export const cancelAccountDeletion = async (uid) => {
  if (!uid) {
    return { success: false, error: 'Missing user id' };
  }

  try {
    const updates = {};
    updates[`accountDeletionRequests/${uid}`] = null;
    updates[`users/${uid}/account/status`] = 'active';
    updates[`users/${uid}/account/deletionRequestedAt`] = null;
    await update(ref(database), updates);
    return { success: true };
  } catch (error) {
    console.error('Error cancelling account deletion:', error);
    return { success: false, error: error.message };
  }
};

