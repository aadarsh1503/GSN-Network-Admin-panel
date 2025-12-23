import { useState, useEffect } from 'react';
import { api } from '../../utils/api';

const VersionDisplay = ({ className = "text-sm text-gray-500" }) => {
  const [version, setVersion] = useState('');

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const data = await api.get('/api/version/current');
        setVersion(data.version_number);
      } catch (error) {
        console.error('Error fetching version:', error);
        setVersion('1.0.0'); // Fallback version
      }
    };

    fetchVersion();
  }, []);

  return (
    <span className={className}>
      v{version}
    </span>
  );
};

export default VersionDisplay;