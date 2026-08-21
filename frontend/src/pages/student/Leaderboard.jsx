import React, { useState, useEffect } from 'react';
import { Card, Badge } from '../../components/common/Surface';
import { xpService } from '../../services/xpService';
import { teamService } from '../../services/teamService';

export const Leaderboard = () => {
  const [tab, setTab] = useState('Individual');
  const tabs = ['Individual', 'Team'];

  const [individuals, setIndividuals] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [indRes, teamRes] = await Promise.all([
          xpService.getLeaderboard('individual'),
          teamService.getTeamLeaderboard()
        ]);
        setIndividuals(indRes || []);
        setTeams(teamRes || []);
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <main className="page">
      <h1 className="title-lg">Leaderboard</h1>
      <p className="lead">See how you stack up against the Katalyst community.</p>

      <nav className="chips" style={{ margin: '32px 0' }}>
        {tabs.map((item) => (
          <button 
            className={`chip ${tab === item ? 'active' : ''}`} 
            key={item} 
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      <Card>
        {tab === 'Individual' ? (
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Level</th>
                <th>XP</th>
              </tr>
            </thead>
            <tbody>
              {individuals.map((s) => (
                <tr key={s.name}>
                  <td>
                    {s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : `#${s.rank}`}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <img className="avatar" src={`https://ui-avatars.com/api/?name=${s.name || 'S'}&background=random`} alt="" style={{ width: 40, height: 40 }} />
                      <strong>{s.name}</strong>
                    </div>
                  </td>
                  <td><Badge>Lvl {s.currentLevel}</Badge></td>
                  <td><strong>{s.totalXP.toLocaleString()}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team Name</th>
                <th>Members</th>
                <th>Total XP</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.name}>
                  <td>
                    {t.rank === 1 ? '🥇' : t.rank === 2 ? '🥈' : t.rank === 3 ? '🥉' : `#${t.rank}`}
                  </td>
                  <td><strong>{t.name}</strong></td>
                  <td>{t.memberIds ? t.memberIds.length : 0} Active</td>
                  <td><strong className="primary">{t.totalXP.toLocaleString()}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {loading && <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>Loading...</div>}
      </Card>
    </main>
  );
};
