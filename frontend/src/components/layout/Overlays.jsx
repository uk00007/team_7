import React from 'react';


export const NotificationPopover = ({ notifications = [], onClose, onMarkRead }) => (
  <div className="popover">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <strong>Notifications</strong>
      <button className="close" onClick={onClose} aria-label="Close notifications">×</button>
    </div>
    <div className="grid" style={{ gap: 10 }}>
      {notifications.length === 0 && <p className="muted small">No notifications.</p>}
      {notifications.map((n) => (
        <div 
          className="surface" 
          style={{ padding: 14, cursor: 'pointer', opacity: n.isRead ? 0.6 : 1 }} 
          key={n._id || n.id || n.title}
          onClick={() => {
            if (!n.isRead && onMarkRead) onMarkRead(n._id || n.id);
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{n.title}</strong>
            {!n.isRead && <span className="notif-dot" style={{ position: 'static', width: 8, height: 8 }} />}
          </div>
          <div className="small muted" style={{ marginTop: 4 }}>{n.body || n.message}</div>
        </div>
      ))}
    </div>
  </div>
);

export const Drawer = ({ title, children, onClose, width }) => (
  <>
    <div className="drawer-backdrop" onClick={onClose} />
    <aside className="drawer" style={width ? { width } : undefined}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', marginBottom: 24 }}>
        <h2 className="title-md">{title}</h2>
        <button className="close" onClick={onClose} aria-label={`Close ${title}`}>×</button>
      </div>
      {children}
    </aside>
  </>
);
