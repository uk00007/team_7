import { useState, useEffect } from 'react';
import { coachService } from '../services/coachService';

export const useCoach = () => {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    coachService.getRecommendation()
      .then(data => { if (isMounted) setRecommendation(data); })
      .catch(() => { /* ignore */ })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  return { recommendation, loading };
};
