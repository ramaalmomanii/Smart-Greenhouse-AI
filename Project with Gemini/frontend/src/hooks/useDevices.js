import { useState, useEffect } from 'react';
import { fetchDevices } from '../api/apiClient';

export function useDevices(pollingInterval = null) {
  const [devices, setDevices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const data = await fetchDevices();
      setDevices(data);
      setError(null);
    } catch (err) {
      setError('Failed to load devices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
    
    if (pollingInterval) {
      const interval = setInterval(loadDevices, pollingInterval);
      return () => clearInterval(interval);
    }
  }, [pollingInterval]);

  return { devices, loading, error, refetch: loadDevices };
} 