import { useState, useEffect } from 'react';
import { activityService } from '../services/activityService';

export const useActivities = (initialFilters = {}) => {
  const [activities, setActivities] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    activityService.getAll(filters)
      .then(data => {
        if (isMounted) {
          // Backend returns { activities: [...], pagination: {...} } — extract the array
          const list = Array.isArray(data) ? data : (data?.activities || []);
          setActivities(list);
          setError(null);
        }
      })
      .catch(err => {
        if (isMounted) setError(err || 'Failed to fetch activities');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [filters]);

  return { activities, loading, error, setFilters, filters };
};
