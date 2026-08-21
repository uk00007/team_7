import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Badge, Card, MetricCard, ProgressBar, SearchBar } from '../../components/common/Surface';
import { Drawer } from '../../components/layout/Overlays';
import { useActivities } from '../../hooks/useActivities';
import { activityService } from '../../services/activityService';
import { analyticsService } from '../../services/analyticsService';
import { submissionService } from '../../services/submissionService';
import { useCallback } from 'react';

import { EngagementTrendsChart } from '../../components/analytics/Charts';

const Momentum = () => (
  <div className="card momentum-line">
    {['Students', 'Learning', 'Practice', 'XP Earned', 'Achievements'].map((item, index) => (
      <div className={`momentum-node ${index === 3 ? 'active' : ''}`} key={item}>
        <div className="node-icon">{index + 1}</div>
        <div className="small">{item}</div>
      </div>
    ))}
  </div>
);

export const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentSubmissions, setRecentSubmissions] = useState([]);

  useEffect(() => {
    Promise.all([
      analyticsService.getAdminOverview(),
      submissionService.getAll()
    ])
    .then(([overview, submissions]) => {
      setData(overview);
      setRecentSubmissions(submissions);
    })
    .catch(err => setError(err.message || 'Failed to load data'))
    .finally(() => setLoading(false));
  }, []);

  if (error) return <main className="page"><Card><p className="label" style={{ color: 'var(--danger)' }}>Error loading dashboard: {error}</p></Card></main>;
  
  const isL = loading;
  const {
    totalStudents = 0,
    activeStudents = 0,
    engagementRate = 0,
    completionRate = 0,
    totalXp = 0,
    topPerformers = []
  } = data || {};

  return (
    <main className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'center', marginBottom: 42 }}>
        <div><h1 className="title-lg">Platform Overview</h1><p className="lead">See how learners are progressing</p></div>
        <div className="chips"><Link className="btn" to="/admin/editor/quiz/new">+ Create Quiz</Link><Link className="btn btn-primary" to="/admin/editor/activity/new">Create Activity</Link></div>
      </div>
      <div className="grid grid-4" style={{ opacity: isL ? 0.5 : 1, transition: 'opacity 0.2s', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <MetricCard label="Total Students" value={isL ? '-' : totalStudents.toLocaleString()} helper="Registered users" />
        <MetricCard label="Active Students" value={isL ? '-' : activeStudents.toLocaleString()} helper="High engagement" />
        <MetricCard label="Engagement Rate" value={isL ? '-' : `${engagementRate}%`} helper="Active interaction" />
        <MetricCard label="Completion Rate" value={isL ? '-' : `${completionRate}%`} helper={<ProgressBar value={completionRate} />} />
        <MetricCard label="Total Platform XP" value={isL ? '-' : totalXp.toLocaleString()} tone="teal" helper="Global experience" />
      </div>
      <div className="grid grid-2" style={{ marginTop: 34, gridTemplateColumns: '2fr 1fr', opacity: isL ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        <Card><h2>Platform Momentum</h2><Momentum /></Card>
        <Card><div className="eyebrow">Platform Insight</div><p className="lead">"SQL Fundamentals" has a <strong className="primary">24% higher</strong> completion rate than average.</p><Link className="primary" to="/admin/insights">Analyze Factors →</Link></Card>
      </div>
      <div className="grid grid-2" style={{ marginTop: 34, gridTemplateColumns: '2fr 1fr', opacity: isL ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        <Card>
          <h2>Engagement Overview</h2>
          {isL ? <div className="media-thumb" style={{ minHeight: 250 }} /> : <EngagementTrendsChart data={data?.engagementTrends} />}
        </Card>
        <Card><h2>Live Feed</h2>{['Sadia completed SQL Fundamentals', 'Aarav unlocked SQL Explorer', 'Elena posted in Data Structures'].map((item) => <p key={item}><span className="dot" /> {item}</p>)}</Card>
      </div>
        <Card><h2>Recent Submissions</h2><table className="table"><tbody>{recentSubmissions.slice(0, 5).map((s) => <tr key={s.id || s._id}><td>{s.studentName || s.student}</td><td>{s.activityTitle || s.activity}</td><td>{s.score || '-'}</td><td><Badge tone="badge-warm">{s.status}</Badge></td></tr>)}</tbody></table></Card>
        <Card>
          <h2>Top Performers</h2>
          {isL ? (
            <p className="muted" style={{ marginTop: 12 }}>Syncing rankings...</p>
          ) : topPerformers.length > 0 ? (
            topPerformers.map((p, index) => (
              <p key={p.id || index} style={{ marginTop: 12 }}><strong>{p.name}</strong><span className="primary" style={{ float: 'right' }}>{p.xp} XP</span></p>
            ))
          ) : (
            <p className="muted" style={{ marginTop: 12 }}>No performers found.</p>
          )}
        </Card>
    </main>
  );
};

export const ManagePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tabs = ['Activities', 'Quizzes', 'Submissions', 'Students', 'Certificates'];

  const getInitialTab = () => {
    if (location.pathname.includes('/admin/students')) return 'Students';
    if (location.pathname.includes('/admin/review')) return 'Submissions';
    return 'Activities';
  };

  const [tab, setTab] = useState(getInitialTab());
  const [review, setReview] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  
  const { activities, loading: activitiesLoading, setFilters } = useActivities();
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [certificates, setCertificates] = useState([]);

  const fetchSubmissions = useCallback(() => {
    setLoadingSubmissions(true);
    submissionService.getPending()
      .then(res => setPendingSubmissions(res))
      .catch(console.error)
      .finally(() => setLoadingSubmissions(false));
  }, []);

  const fetchStudents = useCallback(() => {
    setLoadingStudents(true);
    // Use apiClient directly since userService is a stub on frontend
    import('../../services/apiClient').then(({ default: apiClient }) => {
      apiClient.get('/users/students')
        .then(res => setStudents(res))
        .catch(console.error)
        .finally(() => setLoadingStudents(false));
    });
  }, []);

  const fetchCertificates = useCallback(() => {
    import('../../services/apiClient').then(({ default: apiClient }) => {
      apiClient.get('/certificates')
        .then(res => setCertificates(res || []))
        .catch(console.error);
    });
  }, []);

  useEffect(() => {
    if (tab === 'Submissions') fetchSubmissions();
    if (tab === 'Students') fetchStudents();
    if (tab === 'Certificates') fetchCertificates();
  }, [tab, fetchSubmissions, fetchStudents, fetchCertificates]);

  const handleDeleteActivity = async (id) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        await activityService.remove(id);
        setFilters({ ...{} });
      } catch (err) {
        alert('Failed to delete activity.');
      }
    }
  };

  useEffect(() => {
    setTab(getInitialTab());
    if (location.pathname.includes('/admin/review')) {
      // Hardcoded mock fallback since submissions array might not be ready yet when routing here directly
    }
  }, [location.pathname]);

  return (
    <main className="page">
      <div className="grid grid-3" style={{ marginBottom: 58 }}>
        <MetricCard label="Active Activities" value="124" />
        <MetricCard label="Avg Completion Rate" value="87%" tone="teal" />
        <MetricCard label="New Submissions" value="42" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 24 }}>
        <div><h1 className="title-lg">Manage Platform</h1><p className="lead">Orchestrate learning momentum across the ecosystem.</p></div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/editor/activity/new')}>+ Create Activity</button>
      </div>
      <nav className="chips" style={{ margin: '32px 0' }}>{tabs.map((item) => <button className={`chip ${tab === item ? 'active' : ''}`} key={item} onClick={() => setTab(item)}>{item}</button>)}</nav>
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center', marginBottom: 26 }}>
          <SearchBar placeholder={`Search ${tab.toLowerCase()}...`} />
          <div className="chips"><span className="chip">Type: All</span><span className="chip">Difficulty: All</span><span className="chip">Status: All</span></div>
        </div>
        {(tab === 'Activities' || tab === 'Quizzes') && (
          activitiesLoading ? <p className="muted">Loading activities...</p> :
          activities.map((a) => (
            <div className="list-row" key={a._id || a.id}>
              <div><h3>{a.title}</h3><p className="muted">{a.type} · {a.difficulty}</p></div>
              <strong className="primary">+{a.xpReward || a.xp || 50} XP</strong>
              <Badge tone={a.status === 'Published' || !a.status ? 'badge-cyan' : ''}>{a.status || 'Published'}</Badge>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="icon-btn" onClick={() => navigate(`/admin/editor/${a.type?.toLowerCase() || 'activity'}/${a._id || a.id}`)}>Edit</button>
                <button className="icon-btn" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteActivity(a._id || a.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
        {tab === 'Submissions' && (
          loadingSubmissions ? <p className="muted" style={{ padding: 12 }}>Loading pending submissions...</p> :
          pendingSubmissions.length === 0 ? <p className="muted" style={{ padding: 12 }}>No pending submissions to review.</p> :
          pendingSubmissions.map((s) => (
            <button className="list-row full" style={{ textAlign: 'left', borderLeft: review?.id === (s._id || s.id) ? '2px solid var(--primary)' : 0 }} key={s._id || s.id} onClick={() => setReview(s)}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <img className="avatar" src={s.user?.avatar || s.avatar || `https://ui-avatars.com/api/?name=${s.user?.name || s.student || 'S'}&background=random`} alt="" />
                <div>
                  <h3>{s.user?.name || s.student || 'Unknown Student'}</h3>
                  <p className="muted">{s.activityDetails?.title || s.activity} · {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : s.submitted}</p>
                </div>
              </div>
              <Badge tone="badge-warm">{s.status || 'PENDING'}</Badge>
            </button>
          ))
        )}
        {tab === 'Students' && (
          loadingStudents ? <p className="muted" style={{ padding: 12 }}>Loading students...</p> :
          <table className="table">
            <thead><tr><th>Student</th><th>Level</th><th>XP</th><th>Streak</th><th>Performance</th><th>Last Active</th><th>Status</th></tr></thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} onClick={() => setStudentDetail(s)} style={{ cursor: 'pointer' }}>
                  <td><strong>{s.name}</strong><br/><span className="small muted">{s.email}</span></td>
                  <td><Badge>Lvl {s.level || 1}</Badge></td>
                  <td><strong>{(s.xp || 0).toLocaleString()}</strong></td>
                  <td>{s.streak || 0} days</td>
                  <td><ProgressBar value={Math.min(100, (s.level || 1) * 5)} /></td>
                  <td className="muted">{s.lastActive ? new Date(s.lastActive).toLocaleDateString() : 'Never'}</td>
                  <td><Badge tone={s.status === 'Active' ? 'badge-cyan' : ''}>{s.status}</Badge></td>
                </tr>
              ))}
              {students.length === 0 && <tr><td colSpan="7" className="muted" style={{ textAlign: 'center', padding: 20 }}>No students found.</td></tr>}
            </tbody>
          </table>
        )}
        {tab === 'Certificates' && (
          <div className="grid grid-3">
            {activities.filter(a => a.certificateRequired || a.type === 'CERTIFICATE').slice(0,6).map((a) => {
              const count = certificates.filter(c => c.activityId?._id === a.id || c.activityId === a.id).length;
              return (
                <Card key={a.id || a._id}>
                  <h3>{a.title}</h3>
                  <p className="muted">Issued certificates: {count}</p>
                  <button className="btn">Manage</button>
                </Card>
              );
            })}
            {activities.length > 0 && activities.filter(a => a.certificateRequired || a.type === 'CERTIFICATE').length === 0 && (
              <p className="muted" style={{ gridColumn: '1 / -1' }}>No certificate-issuing activities found.</p>
            )}
          </div>
        )}
      </Card>
      {review && (
        <ReviewDrawer 
          submission={review} 
          onClose={() => setReview(null)} 
          onReviewComplete={() => {
            setReview(null);
            fetchSubmissions();
          }} 
        />
      )}
      {studentDetail && <StudentDrawer student={studentDetail} onClose={() => setStudentDetail(null)} />}
    </main>
  );
};

const ReviewDrawer = ({ submission, onClose, onReviewComplete }) => {
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(100);
  const [saving, setSaving] = useState(false);

  const handleReview = async (status) => {
    setSaving(true);
    try {
      await submissionService.review(submission._id || submission.id, { status, score: Number(score), reviewerFeedback: feedback });
      if (onReviewComplete) {
        onReviewComplete();
      } else {
        onClose();
      }
    } catch (err) {
      alert('Failed to submit review: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer title={submission.user?.name || submission.student || 'Unknown Student'} onClose={onClose} width="520px">
      <p className="muted">{submission.activityDetails?.title || submission.activity}</p>
      
      <div className="label" style={{ marginTop: 28 }}>Activity Prompt</div>
      <div className="surface" style={{ padding: 18, marginTop: 10 }}>{submission.activityDetails?.description || 'Write a query to find all employees who have a salary greater than the average salary of their respective departments.'}</div>
      
      <div className="label primary" style={{ marginTop: 28 }}>Student Submission</div>
      <pre className="surface" style={{ background: '#2d3133', color: '#fff', padding: 20, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
        {submission.content || submission.description || `SELECT e.name, d.dept_name, e.salary
FROM employees e
JOIN departments d ON e.dept_id = d.id
WHERE e.salary > (
  SELECT AVG(salary)
  FROM employees
  WHERE dept_id = e.dept_id
);`}
      </pre>
      
      <div className="surface" style={{ padding: 18, background: '#d9f7ff', color: '#004a60', marginTop: 16 }}><strong>Auto-Analysis:</strong> The logic appears solid. Ensure edge cases are handled.</div>
      
      <label style={{ display: 'block', marginTop: 24, marginBottom: 8 }} className="label">Score (0-100)</label>
      <input className="input" type="number" min="0" max="100" value={score} onChange={e => setScore(e.target.value)} />
      
      <label style={{ display: 'block', marginTop: 16, marginBottom: 8 }} className="label">Feedback</label>
      <textarea className="input" value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Provide constructive feedback..." style={{ minHeight: 100 }} />
      
      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <button className="btn" disabled={saving} onClick={() => handleReview('REJECTED')}>Request Revision</button>
        <button className="btn btn-primary" disabled={saving} onClick={() => handleReview('APPROVED')}>Approve</button>
      </div>
    </Drawer>
  );
};

const StudentDrawer = ({ student, onClose }) => (
  <Drawer title={student.name} onClose={onClose}>
    <div style={{ textAlign: 'center' }}><img className="avatar avatar-ring" style={{ width: 100, height: 100 }} src={student.avatar} alt="" /><p>{student.email}</p></div>
    <div className="grid grid-3"><MetricCard label="Level" value={student.level} /><MetricCard label="XP" value={student.xp} /><MetricCard label="Streak" value={student.streak} /></div>
    <Card><h3>Skills Proficiency</h3>{[['SQL',92],['Java',86],['React',78],['OS',61]].map(([skill,value]) => <p key={skill}>{skill}<span style={{ float: 'right' }}>{value}%</span><ProgressBar value={value} /></p>)}</Card>
    <Card><h3>Learning Journey</h3><p>Level 4 Reached</p><p>7 Day Streak</p><p>Completed SQL Explorer</p></Card>
    <button className="btn btn-primary full">View Full Profile</button>
  </Drawer>
);

export const EditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Quiz',
    difficulty: 'Intermediate',
    estimatedTime: 15,
    xpReward: 100,
    isMandatory: false,
    dueDate: '',
    isTeamBased: false,
    certificateRequired: false
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      activityService.getById(id)
        .then(data => {
          setFormData({
            title: data.title || '',
            description: data.description || '',
            type: data.type || 'Quiz',
            difficulty: data.difficulty || 'Intermediate',
            estimatedTime: data.estimatedTime || data.time || 15,
            xpReward: data.xpReward || data.xp || 100,
            isMandatory: data.isMandatory || false,
            dueDate: data.dueDate ? data.dueDate.split('T')[0] : '',
            isTeamBased: data.isTeamBased || false,
            certificateRequired: data.certificateRequired || false
          });
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (publish = false) => {
    setSaving(true);
    try {
      const payload = { ...formData, status: publish ? 'Published' : 'Draft' };
      if (isNew) {
        await activityService.create(payload);
      } else {
        await activityService.update(id, payload);
      }
      navigate('/admin/activities');
    } catch (err) {
      alert('Failed to save activity: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="page"><p className="muted">Loading editor...</p></main>;

  return (
    <main className="page" style={{ width: '100%', padding: 0 }}>
      <header className="topbar">
        <div style={{ display: 'flex', gap: 26, alignItems: 'center' }}>
          <span className="brand">Katalyst</span>
          <span className="title-md">{isNew ? 'Create Activity' : 'Edit Activity'}</span>
          <Badge>Draft</Badge>
        </div>
        <div className="chips">
          <button className="btn btn-ghost" onClick={() => handleSave(false)} disabled={saving}>Save Draft</button>
          <button className="btn">Preview</button>
          <button className="btn btn-primary" onClick={() => handleSave(true)} disabled={saving}>{saving ? 'Saving...' : 'Publish ▷'}</button>
        </div>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(420px, 48%)', minHeight: 'calc(100vh - 76px)' }}>
        <section className="card-pad" style={{ background: '#fff' }}>
          <h1>Activity Details</h1>
          <div className="grid" style={{ gap: 22 }}>
            <label>Title<input className="input" name="title" value={formData.title} onChange={handleChange} placeholder="Advanced Product Design Principles" /></label>
            <label>Description<textarea className="input" name="description" value={formData.description} onChange={handleChange} placeholder="Explore advanced concepts..." /></label>
            <div className="form-grid">
              <label>Type
                <select className="input" name="type" value={formData.type} onChange={handleChange}>
                  <option value="Quiz">Interactive Quiz</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Course">Course</option>
                </select>
              </label>
              <label>Difficulty
                <select className="input" name="difficulty" value={formData.difficulty} onChange={handleChange}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </label>
              <label>Estimated Time (min)<input className="input" type="number" name="estimatedTime" value={formData.estimatedTime} onChange={handleChange} /></label>
              <label>XP Reward<input className="input primary" type="number" name="xpReward" value={formData.xpReward} onChange={handleChange} /></label>
              <label>Due Date<input className="input" type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} /></label>
            </div>
            
            <div className="form-grid" style={{ marginTop: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" name="isMandatory" checked={formData.isMandatory} onChange={handleChange} /> Mandatory Activity
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" name="isTeamBased" checked={formData.isTeamBased} onChange={handleChange} /> Team Based
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" name="certificateRequired" checked={formData.certificateRequired} onChange={handleChange} /> Certificate Required
              </label>
            </div>
          </div>
          <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '42px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2>Questions</h2><button className="btn">+ Add Question</button></div>
          {['What is the primary goal of minimalist design?', 'Which metric best measures momentum?'].map((q) => <div className="surface" style={{ padding: 22, marginTop: 14 }} key={q}><strong>{q}</strong><p>○ To reduce load times</p><p className="primary">● To focus on essential content</p><p>○ To use fewer colors</p></div>)}
        </section>
        <aside style={{ background: '#eceef0', display: 'grid', placeItems: 'center', padding: 40 }}>
          <div className="card card-pad" style={{ width: 430, minHeight: 720, borderRadius: 36 }}>
            <p>← Preview</p>
            <div className="media-thumb" style={{ minHeight: 210 }} />
            <div className="chips" style={{ marginTop: 24 }}>
              <Badge tone="badge-cyan">{formData.type}</Badge>
              <Badge>{formData.difficulty}</Badge>
              {formData.isMandatory && <Badge tone="badge-warm">Mandatory</Badge>}
            </div>
            <h2 className="title-md">{formData.title || 'Activity Title'}</h2>
            <p>{formData.description || 'Activity description will appear here.'}</p>
            <Card>
              <strong>Completion Reward</strong>
              <h2 className="primary">+{formData.xpReward} XP</h2>
              <ProgressBar value={0} />
            </Card>
            <button className="btn btn-gradient full">Start Activity</button>
          </div>
        </aside>
      </div>
    </main>
  );
};

export const InsightsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getAdminAnalytics()
      .then(res => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const { activeLearners = 842, completionRate = 78, avgScore = 84, xpEarned = '24.8k', engagementTrends = [], completionFunnel = [] } = data || {};

  return (
    <main className="page">
      <h1 className="title-lg">Insights</h1>
      <p className="lead">Understand how learners are learning, improving and progressing.</p>
      <div className="grid grid-4" style={{ marginTop: 36, opacity: loading ? 0.5 : 1 }}>
        <MetricCard label="Active Learners" value={loading ? '-' : activeLearners} helper="+12%" />
        <MetricCard label="Completion Rate" value={loading ? '-' : `${completionRate}%`} />
        <MetricCard label="Avg Score" value={loading ? '-' : `${avgScore}%`} />
        <MetricCard label="XP Earned" value={loading ? '-' : xpEarned} />
      </div>
      <div className="grid grid-2" style={{ marginTop: 34, gridTemplateColumns: '2fr 1fr' }}>
        <Card>
          <h2>Engagement Trends</h2>
          {loading ? <div className="media-thumb" style={{ minHeight: 330 }} /> : <EngagementTrendsChart data={engagementTrends} />}
        </Card>
        <Card>
          <h2>Completion Funnel</h2>
          {(completionFunnel.length > 0 ? completionFunnel : [['Started',100],['Completed',78],['In Progress',18],['Abandoned',8]]).map(([label,value]) => <p key={label}>{label}<span style={{ float: 'right' }}>{value}%</span><ProgressBar value={value} /></p>)}
        </Card>
      </div>
      <h2 className="title-md" style={{ marginTop: 44 }}>Katalyst AI Insights</h2>
      <div className="grid grid-3" style={{ marginTop: 18 }}>{['SQL Fundamentals Outperforming', 'Most Improved Skill: SQL', 'Most Challenging: OS Concepts'].map((title) => <Card key={title}><h3>{title}</h3><p className="muted">Completion rate is <strong className="primary">24% higher</strong> than baseline. Consider applying this format to adjacent modules.</p></Card>)}</div>
      <h2 className="title-md" style={{ marginTop: 44 }}>Platform Momentum</h2><Momentum />
    </main>
  );
};

export const AdminProfilePage = () => {
  const { user } = useAuth();
  return (
    <main className="page page-narrow">
      <h1 className="title-lg" style={{ marginBottom: 34 }}>Admin Profile</h1>
      <Card style={{ display: 'flex', gap: 28, alignItems: 'center' }}><img className="avatar" style={{ width: 132, height: 132 }} src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'A'}&background=random`} alt="" /><div><h1>{user?.name || 'Admin'}</h1><p className="lead">{user?.role || 'Super Admin'}</p><Badge>Super Admin Access</Badge></div></Card>
      <Card><div className="label">Managing Katalyst</div><div className="grid grid-2"><MetricCard label="Active Learners" value="842" /><MetricCard label="Completion Rate" value="78%" tone="teal" /></div></Card>
    <div className="grid grid-2" style={{ marginTop: 34, gridTemplateColumns: '2fr 1fr' }}>
      <Card><h2>Account Information</h2><div className="form-grid"><label>First Name<input className="input" defaultValue="Jane" /></label><label>Last Name<input className="input" defaultValue="Doe" /></label></div><label>Email Address<input className="input" defaultValue="jane.doe@katalyst.edu" /></label><label>Primary Role<input className="input" defaultValue="Administrator" /></label><button className="btn btn-primary" style={{ float: 'right', marginTop: 24 }}>Save Changes</button></Card>
      <div className="grid"><Card><h2>Preferences</h2><p>Email Notifications <span className="badge-primary badge" style={{ float: 'right' }}>On</span></p><p>Dark Mode <span className="badge" style={{ float: 'right' }}>Off</span></p></Card><Card><h2>Security</h2><p>Google Auth Linked<br /><span className="muted">jane.doe@katalyst.edu</span></p><div className="surface" style={{ padding: 16 }}>Last Login: Today, 09:42 AM</div></Card><button className="btn full" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>Log Out</button></div>
    </div>
  </main>
  );
};
