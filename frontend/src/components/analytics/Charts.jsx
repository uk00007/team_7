import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, BarChart, Bar } from 'recharts';

export const XpGrowthChart = ({ data = [] }) => {
  const chartData = data?.length > 0 ? data : [
    { name: 'Week 1', xp: 120 },
    { name: 'Week 2', xp: 300 },
    { name: 'Week 3', xp: 280 },
    { name: 'Week 4', xp: 520 },
    { name: 'Week 5', xp: 700 },
  ];

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text)', opacity: 0.6, fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text)', opacity: 0.6, fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text)' }}
            itemStyle={{ color: 'var(--primary)', fontWeight: 600 }}
          />
          <Area type="monotone" dataKey="xp" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#xpGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const EngagementTrendsChart = ({ data = [] }) => {
  const chartData = data?.length > 0 ? data : [
    { name: 'Mon', active: 400, completions: 240 },
    { name: 'Tue', active: 520, completions: 310 },
    { name: 'Wed', active: 680, completions: 420 },
    { name: 'Thu', active: 550, completions: 350 },
    { name: 'Fri', active: 710, completions: 480 },
    { name: 'Sat', active: 300, completions: 120 },
    { name: 'Sun', active: 250, completions: 90 },
  ];

  return (
    <div style={{ width: '100%', height: 330 }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text)', opacity: 0.6, fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text)', opacity: 0.6, fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text)' }}
          />
          <Line type="monotone" dataKey="active" name="Active Learners" stroke="var(--primary)" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="completions" name="Completions" stroke="var(--teal)" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
