import React, { useState, useEffect } from 'react';
import { Card, MetricCard, Badge } from '../../components/common/Surface';
import { teamService } from '../../services/teamService';

export const Team = () => {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    teamService.getMyTeam()
      .then(res => setTeam(res))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="page"><p className="muted">Loading team data...</p></main>;
  if (error || !team) return (
    <main className="page">
      <h1 className="title-lg">Your Team</h1>
      <Card style={{ marginTop: 24 }}>
        <p className="muted" style={{ padding: 12 }}>You are not currently in a team. Join one to participate in team challenges.</p>
      </Card>
    </main>
  );

  const totalXP = team.totalXP || team.members?.reduce((acc, m) => acc + (m.xp || 0), 0) || 0;
  
  return (
    <main className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 44 }}>
        <div>
          <div className="eyebrow">Your Team</div>
          <h1 className="title-lg">{team.name || 'Team Name'}</h1>
          <p className="lead">{team.description || 'Working together to dominate the leaderboards.'}</p>
        </div>
        <Badge tone="badge-primary">Rank #{team.rank || '-'} Global</Badge>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 44 }}>
        <MetricCard label="Total Team XP" value={totalXP.toLocaleString()} helper="Combined team effort" />
        <MetricCard label="Global Rank" value={`#${team.rank || '-'}`} tone="teal" helper={`Top ${team.percentile || 10}% of teams`} />
        <MetricCard label="Active Members" value={team.members?.length || 0} helper={`${Math.max(0, 5 - (team.members?.length || 0))} slots remaining`} />
      </div>

      <Card>
        <h2>Team Members</h2>
        <table className="table" style={{ marginTop: 24 }}>
          <thead>
            <tr>
              <th>Member</th>
              <th>Role</th>
              <th>Individual XP Contributed</th>
              <th>Team Share</th>
            </tr>
          </thead>
          <tbody>
            {(team.members || []).map((m) => {
              const contribution = totalXP > 0 ? ((m.xp || 0) / totalXP * 100).toFixed(1) : 0;
              return (
                <tr key={m.id || m._id || m.name}>
                  <td>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <img className="avatar" src={m.avatar || `https://ui-avatars.com/api/?name=${m.name || 'User'}&background=random`} alt="" style={{ width: 40, height: 40 }} />
                      <div>
                        <strong>{m.name || 'Unknown Member'}</strong>
                      </div>
                    </div>
                  </td>
                  <td><Badge tone={m.role === 'Team Captain' || m.isLeader ? 'badge-cyan' : ''}>{m.isLeader ? 'Team Captain' : m.role || 'Member'}</Badge></td>
                  <td>{(m.xp || 0).toLocaleString()} XP</td>
                  <td><strong>{contribution}%</strong></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </main>
  );
};
