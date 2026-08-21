import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUserStats } from '../../hooks/useUserStats';
import { NotificationPopover } from './Overlays';
import { notificationService } from '../../services/notificationService';

export const useNotifications = () => {
  const [items, setItems] = useState([]);
  
  const fetchNotifs = useCallback(() => {
    notificationService.getAll()
      .then(res => setItems(res || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const markRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setItems(items => items.map(n => (n.id === id || n._id === id) ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = items.filter(n => !n.isRead).length;

  return { items, unreadCount, markRead };
};

const Bell = ({ onClick, unreadCount }) => (
  <button className="icon-btn" onClick={onClick} aria-label="Open notifications" style={{ position: 'relative' }}>
    {unreadCount > 0 && <span className="notif-dot" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 'bold' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
    <span>!</span>
  </button>
);

const Robot = () => <span style={{ fontSize: 20 }}>▣</span>;

export const StudentNavbar = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { items, unreadCount, markRead } = useNotifications();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { stats } = useUserStats();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="topbar">
        <button className="brand" onClick={() => navigate('/student/dashboard')} style={{ border: 0, background: 'transparent' }}>Katalyst</button>
        <nav className="topbar-center">
          <NavLink className="nav-link" to="/student/dashboard">Home</NavLink>
          <NavLink className="nav-link" to="/student/activities">Learn</NavLink>
          <NavLink className="nav-link" to="/student/leaderboard">Leaderboard</NavLink>
        </nav>
        <div className="topbar-actions">
          <span className="streak-pill"><span className="orange">△</span>{stats?.streak || 0}</span>
          <button className="icon-btn" aria-label="AI Coach"><Robot /></button>
          <Bell onClick={() => setShowNotifications((v) => !v)} unreadCount={unreadCount} />
          <button onClick={() => navigate('/student/profile')} style={{ border: 0, background: 'transparent', padding: 0 }} aria-label="Open profile">
            <img className="avatar avatar-ring" src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'S'}&background=random`} alt={user?.name || 'Student'} title={user?.name} />
          </button>
          <button className="btn btn-ghost" onClick={handleLogout} style={{ padding: '0 8px', fontSize: 12 }}>Log Out</button>
        </div>
      </header>
      {showNotifications && <NotificationPopover notifications={items} onMarkRead={markRead} onClose={() => setShowNotifications(false)} />}
    </>
  );
};

export const AdminNavbar = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { items, unreadCount, markRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isManageActive = ['/admin/manage', '/admin/activities', '/admin/students', '/admin/review'].some(path => location.pathname.startsWith(path));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="topbar">
        <button className="brand" onClick={() => navigate('/admin/dashboard')} style={{ border: 0, background: 'transparent' }}>Katalyst</button>
        <nav className="topbar-center">
          <NavLink className="nav-link" to="/admin/dashboard">Dashboard</NavLink>
          <NavLink className={`nav-link ${isManageActive ? 'active' : ''}`} to="/admin/activities">Manage</NavLink>
          <NavLink className="nav-link" to="/admin/reports">Insights</NavLink>
        </nav>
        <div className="topbar-actions">
          <button className="icon-btn" aria-label="Admin AI tools"><Robot /></button>
          <Bell onClick={() => setShowNotifications((v) => !v)} unreadCount={unreadCount} />
          <button onClick={() => navigate('/admin/profile')} style={{ border: 0, background: 'transparent', padding: 0 }} aria-label="Open admin profile">
            <img className="avatar" src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'A'}&background=random`} alt={user?.name || 'Admin'} title={user?.name} />
          </button>
          <button className="btn btn-ghost" onClick={handleLogout} style={{ padding: '0 8px', fontSize: 12 }}>Log Out</button>
        </div>
      </header>
      {showNotifications && <NotificationPopover notifications={items} onMarkRead={markRead} onClose={() => setShowNotifications(false)} />}
    </>
  );
};
