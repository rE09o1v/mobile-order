import { useState, useEffect } from 'react';
import { networkManager } from '../lib/errorHandling';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(networkManager.isOnline);

  useEffect(() => {
    const unsubscribe = networkManager.addListener((status) => {
      setIsOnline(status === 'online');
    });

    return unsubscribe;
  }, []);

  return isOnline;
}; 