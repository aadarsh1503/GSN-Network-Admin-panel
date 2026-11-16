import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../utils/api';
import { computeProfileCompletion } from '../utils/profileCompletion';

const ProfileCompletionContext = createContext(null);

const PROFILE_ENDPOINTS = {
  company: '/api/company/profile',
  business: '/api/business/profile',
  user: '/api/user/me',
};

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const unwrap = (payload, role) => {
  if (!payload) return null;
  // /api/user/me wraps the profile as { user: {...} }
  if (role === 'user') return payload.user || payload;
  return payload.user || payload;
};

export const ProfileCompletionProvider = ({ children }) => {
  const location = useLocation();
  const [role, setRole] = useState(() => readStoredUser()?.role || null);
  const [userId, setUserId] = useState(() => readStoredUser()?.id || null);
  const [profile, setProfile] = useState(null);
  const [bankDetails, setBankDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  const isTracked = role === 'company' || role === 'business' || role === 'user';

  const refresh = useCallback(async () => {
    const stored = readStoredUser();
    const currentRole = stored?.role;
    if (!stored?.id || !PROFILE_ENDPOINTS[currentRole]) {
      setProfile(null);
      setBankDetails([]);
      return;
    }

    setLoading(true);
    const [profileResult, bankResult] = await Promise.allSettled([
      api.get(PROFILE_ENDPOINTS[currentRole]),
      api.get('/api/bank-details/my'),
    ]);

    if (profileResult.status === 'fulfilled') {
      setProfile(unwrap(profileResult.value, currentRole));
    }
    if (bankResult.status === 'fulfilled' && Array.isArray(bankResult.value)) {
      setBankDetails(bankResult.value);
    }
    setLoading(false);
  }, []);

  // Re-read the logged-in identity from storage. Same-tab login / registration
  // happens through SPA navigation (no page reload) and the `storage` event only
  // fires across tabs, so we also re-sync on every route change. Without this the
  // role stayed null and every account was reported as "100% complete".
  const syncIdentity = useCallback(() => {
    const stored = readStoredUser();
    setRole(stored?.role || null);
    setUserId(stored?.id || null);
  }, []);

  useEffect(() => {
    syncIdentity();
    window.addEventListener('storage', syncIdentity);
    window.addEventListener('userLogout', syncIdentity);
    window.addEventListener('profileCompletionRefresh', syncIdentity);
    return () => {
      window.removeEventListener('storage', syncIdentity);
      window.removeEventListener('userLogout', syncIdentity);
      window.removeEventListener('profileCompletionRefresh', syncIdentity);
    };
  }, [syncIdentity]);

  useEffect(() => {
    syncIdentity();
  }, [location.pathname, syncIdentity]);

  useEffect(() => {
    if (isTracked) refresh();
    else {
      setProfile(null);
      setBankDetails([]);
    }
  }, [isTracked, userId, refresh]);

  useEffect(() => {
    if (!isTracked) return undefined;
    const handler = () => refresh();
    window.addEventListener('profileUpdated', handler);
    window.addEventListener('businessProfileUpdated', handler);
    window.addEventListener('companyProfileUpdated', handler);
    window.addEventListener('bankDetailsUpdated', handler);
    return () => {
      window.removeEventListener('profileUpdated', handler);
      window.removeEventListener('businessProfileUpdated', handler);
      window.removeEventListener('companyProfileUpdated', handler);
      window.removeEventListener('bankDetailsUpdated', handler);
    };
  }, [isTracked, refresh]);

  const completion = useMemo(
    () => computeProfileCompletion(role, profile, bankDetails),
    [role, profile, bankDetails]
  );

  const value = useMemo(
    () => ({
      role,
      userId,
      profile,
      bankDetails,
      loading,
      isTracked,
      refresh,
      hasBankDetails: bankDetails.length > 0,
      ...completion,
    }),
    [role, userId, profile, bankDetails, loading, isTracked, refresh, completion]
  );

  return (
    <ProfileCompletionContext.Provider value={value}>
      {children}
    </ProfileCompletionContext.Provider>
  );
};

export const useProfileCompletionContext = () => {
  const ctx = useContext(ProfileCompletionContext);
  if (!ctx) {
    throw new Error('useProfileCompletionContext must be used inside ProfileCompletionProvider');
  }
  return ctx;
};

export default ProfileCompletionContext;
