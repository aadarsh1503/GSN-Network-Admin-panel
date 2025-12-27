import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export const useGeneralSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/general-settings');
      if (response.success) {
        setSettings(response.data);
      } else {
        setError('Failed to fetch settings');
      }
    } catch (err) {
      console.error('Error fetching general settings:', err);
      setError('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings
  };
};

export const useLogo = () => {
  const { settings, loading, error } = useGeneralSettings();
  
  const logoUrl = settings.admin_logo?.value || null; // Cloudinary URLs are already full URLs
  const companyName = settings.company_name?.value || 'GSN Network';
  
  return {
    logoUrl,
    companyName,
    loading,
    error
  };
};