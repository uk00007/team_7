import React, { useState, useEffect } from 'react';
import { Drawer } from '../layout/Overlays';
import { coachService } from '../../services/coachService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const AICoach = () => {
  const [open, setOpen] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (open && !recommendation) {
      setLoading(true);
      coachService.getRecommendation()
        .then(res => setRecommendation(res))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, recommendation]);

  return (
    <>
      <div className="coach-float">
        <div className="coach-bubble">Want a personalized recommendation? Talk to me.</div>
        <button className="coach-orb" onClick={() => setOpen(true)} aria-label="Open AI Coach">
          <img src="/assets/ai-coach.png" alt="Katalyst AI Coach" />
        </button>
      </div>
      {open && (
        <Drawer title="AI Coach" onClose={() => setOpen(false)}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img src="/assets/ai-coach.png" alt="" style={{ width: 132, height: 132, borderRadius: 999, objectFit: 'cover', boxShadow: 'var(--shadow)' }} />
          </div>
          <p className="lead">Hey {user?.name || 'there'}, {recommendation?.message || "I'm your personal learning assistant."}</p>
          
          {loading && <p className="muted">Thinking...</p>}
          
          {recommendation?.activity && (
            <div className="card card-pad" style={{ margin: '22px 0' }}>
              <div className="eyebrow">Recommended Activity</div>
              <h3>{recommendation.activity.title}</h3>
              <p className="muted">{recommendation.activity.description}</p>
              <button className="btn btn-primary full" onClick={() => { setOpen(false); navigate(`/student/activity/${recommendation.activity.id || recommendation.activity._id}`); }}>Start</button>
            </div>
          )}
          
          <textarea className="input" placeholder="Ask me anything..." style={{ marginTop: 'auto' }} />
        </Drawer>
      )}
    </>
  );
};
