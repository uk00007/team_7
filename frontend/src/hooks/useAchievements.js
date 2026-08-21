import { useState, useEffect } from 'react';
import { xpService } from '../services/xpService';

export const useAchievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    xpService.getMyAchievements()
      .then(data => {
        if (isMounted) setAchievements(data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  return { achievements, loading };
};
