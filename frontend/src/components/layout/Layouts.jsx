import React from 'react';
import { Outlet } from 'react-router-dom';
import { AICoach } from '../coach/AICoach';
import { AdminNavbar, StudentNavbar } from './Navbars';

export const StudentLayout = () => (
  <div className="app-shell">
    <StudentNavbar />
    <Outlet />
    <AICoach />
  </div>
);

export const AdminLayout = () => (
  <div className="app-shell">
    <AdminNavbar />
    <Outlet />
  </div>
);
