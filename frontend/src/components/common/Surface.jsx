import React from 'react';

export const Card = ({ children, className = '' }) => (
  <section className={`card card-pad ${className}`}>{children}</section>
);

export const ProgressBar = ({ value = 0, className = '' }) => (
  <div className={`progress ${className}`}>
    <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);

export const Badge = ({ children, tone = '' }) => (
  <span className={`badge ${tone}`}>{children}</span>
);

export const MetricCard = ({ label, value, helper, tone = '' }) => (
  <Card className="stat">
    <div className="label">{label}</div>
    <div>
      <div className={`stat-value ${tone}`}>{value}</div>
      {helper && <div className="small muted" style={{ marginTop: 8 }}>{helper}</div>}
    </div>
  </Card>
);

export const SearchBar = ({ placeholder }) => (
  <div className="input" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <span style={{ fontSize: 24, color: '#6d6d7d' }}>⌕</span>
    <span className="muted">{placeholder}</span>
  </div>
);
