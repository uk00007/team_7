import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Badge, Card, MetricCard, ProgressBar, SearchBar } from '../../components/common/Surface';
import { useUserStats } from '../../hooks/useUserStats';
import { useCoach } from '../../hooks/useCoach';
import { useActivities } from '../../hooks/useActivities';
import { useAchievements } from '../../hooks/useAchievements';
import { submissionService } from '../../services/submissionService';
import { activityService } from '../../services/activityService';
import { XpGrowthChart } from '../../components/analytics/Charts';

const ActivityCard = ({ activity }) => (
  <Link to={`/student/activity/${activity._id || activity.id}`} className="card card-pad activity-card">
    <div className="activity-card-top">
      <div className="activity-icon">◇</div>
      <Badge tone="badge-primary">+{activity.xpReward || activity.xp || 50} XP</Badge>
    </div>
    <div className="label muted" style={{ marginTop: 24 }}>{activity.type}</div>
    <h3>{activity.title}</h3>
    <p className="muted">{activity.description}</p>
    {activity.isMandatory && <Badge tone="badge-warm" style={{ marginTop: 12 }}>Mandatory</Badge>}
  </Link>
);

export const StudentHomePage = () => {
  const { user } = useAuth();
  const { stats, loading: statsLoading, error: statsError } = useUserStats();
  const { recommendation, loading: coachLoading } = useCoach();
  const { achievements, loading: achievementsLoading } = useAchievements();
  const { activities, loading: activitiesLoading } = useActivities();

  if (statsError) {
    return (
      <main className="page student-home">
        <div className="card card-pad" style={{ textAlign: 'center' }}>
          <h2 className="title-md" style={{ color: 'var(--danger)' }}>Failed to load dashboard</h2>
          <p className="muted">Please try refreshing the page.</p>
        </div>
      </main>
    );
  }

  const isL = statsLoading;
  const level = stats?.level || 1;
  const xp = stats?.xp || 0;
  const nextXp = stats?.nextLevelXp || 100;
  const streak = stats?.streak || 0;
  const xpLeft = Math.max(0, nextXp - xp);
  const progress = Math.min(100, (xp / nextXp) * 100) || 0;
  const teamRank = stats?.teamRank || '-';
  const xpThisWeek = stats?.xpThisWeek || 0;
  const activitiesThisWeek = stats?.activitiesCompletedThisWeek || 0;

  // Handle both AI service shape and backend fallback shape
  const firstRec = recommendation?.data?.recommendations?.[0]
    || recommendation?.recommendedActivities?.[0];
  const coachMessage = firstRec?.reason
    || recommendation?.coachingTip
    || recommendation?.message
    || "Your next best move is ready. Keep the streak alive, finish one focused session, and move closer to your next level.";
  const coachActionTitle = firstRec?.title
    ? `Start: ${firstRec.title}`
    : (recommendation?.actionTitle || "Resume Learning");
  const coachActionUrl = firstRec?.id
    ? `/student/activities/${firstRec.id}`
    : (recommendation?.actionUrl || "/student/activities");

  const displayAchievements = achievementsLoading ? [] : achievements.slice(0, 3);
  while (displayAchievements.length < 3) {
    displayAchievements.push({ name: 'Locked', isLocked: true, icon: '□' });
  }

  return (
    <main className="page student-home">
      <div className="home-grid">
        <section className="card home-hero">
          <div className="home-hero-copy">
            <div className="eyebrow">Today in Katalyst</div>
            <h1 className="title-xl">Good morning, {user?.name ? user.name.split(' ')[0] : 'Learner'}</h1>
            <p className="lead" style={{ opacity: coachLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>{coachMessage}</p>
            <div className="home-actions">
              <Link className="btn btn-primary" to={coachActionUrl} style={{ opacity: coachLoading ? 0.5 : 1 }}>{coachActionTitle}</Link>
              <Link className="btn" to="/student/leaderboard">View Progress</Link>
            </div>
          </div>
          <div className="momentum-orbit" aria-hidden="true" style={{ opacity: isL ? 0.3 : 1, transition: 'opacity 0.3s' }}>
            <span className="orbit-ring ring-one" />
            <span className="orbit-ring ring-two" />
            <span className="orbit-core">L{level}</span>
            <span className="orbit-node node-a">SQL</span>
            <span className="orbit-node node-b">XP</span>
            <span className="orbit-node node-c">{streak}d</span>
          </div>
        </section>

        <section className="home-status-strip" style={{ opacity: isL ? 0.5 : 1, transition: 'opacity 0.3s' }}>
          <Card className="status-card status-card-wide">
            <div className="status-card-head">
              <div>
                <div className="label">Current Status</div>
                <h2 className="title-md"><span className="primary">Level {level}</span> {xp} / {nextXp} XP</h2>
              </div>
              <Badge tone="badge-warm">{streak} Day Streak</Badge>
            </div>
            <ProgressBar value={progress} />
            <p className="muted">{xpLeft} XP left to reach Level {level + 1}.</p>
          </Card>
          <Card className="mini-stat-card">
            <div className="label">This Week</div>
            <strong>+{xpThisWeek} XP</strong>
            <span className="muted">{activitiesThisWeek} activities completed</span>
          </Card>
          <Card className="mini-stat-card">
            <div className="label">Team Rank</div>
            <strong>#{teamRank}</strong>
            <span className="muted">Top {stats?.teamRankPercentile || 12}% this month</span>
          </Card>
        </section>

      <section className="home-main-row">
        <Link to="/student/activity/database-fundamentals" className="card continue-card">
          <div className="module-art module-art-premium">
            <span />
            <span />
            <span />
          </div>
          <div className="card-pad continue-card-copy">
            <div className="eyebrow">Continue Learning</div>
            <h2 className="title-md">Database Fundamentals</h2>
            <p className="lead">Master relational databases, SQL queries, and data normalization with one focused session.</p>
            <div className="continue-meta">
              <div><strong>68%</strong><span>Complete</span></div>
              <div><strong>12/18</strong><span>Lessons</span></div>
              <div><strong>25 min</strong><span>Next session</span></div>
            </div>
            <ProgressBar value={68} />
          </div>
        </Link>

        <aside className="grid home-side">
          <Card className="recommended-card">
            <div className="section-title-row">
              <h2>Recommended</h2>
              <Link className="primary" to="/student/learn">View all</Link>
            </div>
            {activitiesLoading && <div className="media-thumb" style={{ minHeight: 180 }} />}
          {!activitiesLoading && activities.slice(0, 2).map((activity) => (
              <Link key={activity.id} to={`/student/activity/${activity.id}`} className="recommended-row">
                <div className="activity-icon compact">◇</div>
                <div><strong>{activity.title}</strong><div className="muted">{activity.difficulty} · <span className="primary">+{activity.xp} XP</span></div></div>
                <span>›</span>
              </Link>
            ))}
          </Card>
          <Card>
            <div className="section-title-row">
              <h2>Achievements</h2>
              <Link className="primary" to="/student/progress">View all</Link>
            </div>
            <div className="achievement-row">
              {displayAchievements.map((item, index) => (
                <div className={`achievement-tile ${item.isLocked ? 'locked' : ''}`} key={item.name + index}>
                  <span>{item.icon || (item.name === 'Fast Learner' ? '↗' : item.name.includes('SQL') ? 'DB' : '⭐')}</span>
                  <strong>{item.name}</strong>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </section>

      <section>
        <div className="section-title-row section-spaced">
          <div>
            <div className="eyebrow">Up Next</div>
            <h2 className="title-md">Keep Building Momentum</h2>
          </div>
          <Link className="btn" to="/student/learn">Explore Learn</Link>
        </div>
        <div className="grid grid-4 home-activity-grid">
          {activitiesLoading ? <div className="media-thumb" style={{ minHeight: 120 }} /> : activities.slice(2, 4).map((activity) => <ActivityCard key={activity.id || activity._id} activity={activity} />)}
        </div>
      </section>
    </div>
  </main>
  );
};

export const LearnPage = () => {
  const { activities, loading, setFilters, filters } = useActivities();
  const uiTabs = ['All', 'Courses', 'Assignments', 'Quizzes', 'Puzzles'];
  const currentTab = filters.type || 'All';

  const handleTabClick = (tab) => {
    setFilters(tab === 'All' ? {} : { type: tab });
  };

  return (
    <main className="page">
      <h1 className="title-lg">Learn</h1>
      <p className="lead">Build your skills through challenges, courses and practice.</p>
      <div style={{ maxWidth: 1080, marginTop: 36 }}><SearchBar placeholder="Search courses, challenges and topics..." /></div>
      <div className="chips" style={{ margin: '28px 0 48px' }}>
        {uiTabs.map((tab) => (
          <button 
            className={`chip ${currentTab === tab ? 'active' : ''}`} 
            key={tab} 
            onClick={() => handleTabClick(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <section className="card card-pad" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 40, alignItems: 'center' }}>
        <div>
          <div className="eyebrow">Course in Progress</div>
          <h2 className="title-md">Database Fundamentals</h2>
          <p className="lead">Master the core concepts of relational databases, SQL querying, and data modeling to build robust backend systems.</p>
          <div style={{ maxWidth: 540 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Progress</strong><strong className="primary">65%</strong></div><ProgressBar value={65} /></div>
          <Link className="btn btn-primary" to="/student/activity/database-fundamentals" style={{ marginTop: 28 }}>Continue Learning →</Link>
        </div>
        <div className="media-thumb" />
      </section>
      <h2 className="title-md" style={{ marginTop: 48 }}>Recommended for You</h2>
      {loading ? (
        <p className="muted" style={{ marginTop: 24 }}>Loading activities...</p>
      ) : (
        <div className="grid grid-4" style={{ marginTop: 24 }}>
          {activities.length ? activities.map((a) => <ActivityCard key={a._id || a.id} activity={a} />) : <p className="muted">No activities found matching filters.</p>}
        </div>
      )}
    </main>
  );
};

const SubmissionSection = ({ activityId, enrollStatus }) => {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    submissionService.getByActivity(activityId)
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          setSubmission(data[0]);
        } else if (data && !Array.isArray(data)) {
          setSubmission(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activityId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (description) formData.append('description', description);
      
      const newSub = await submissionService.submit(activityId, formData);
      setSubmission(newSub);
    } catch (error) {
      setSubmitError(error.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Card><p className="muted">Loading submission status...</p></Card>;

  if (submission) {
    const tone = submission.status === 'APPROVED' ? 'badge-primary' : submission.status === 'REJECTED' ? 'badge-warm' : '';
    return (
      <Card>
        <h2>Submission Status</h2>
        <div style={{ marginTop: 16 }}>
          <Badge tone={tone}>{submission.status || 'UNDER_REVIEW'}</Badge>
        </div>
        <div className="surface" style={{ padding: 16, marginTop: 16 }}>
          <div className="label">Feedback</div>
          <p>{submission.feedback || 'No feedback yet. Your submission is being reviewed.'}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2>Submit Assignment</h2>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 8, marginTop: 16 }}>Description</label>
        <textarea 
          className="form-control" 
          style={{ width: '100%', minHeight: 80, marginBottom: 16, padding: 12, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit' }} 
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Add details about your submission..."
          required
        />
        <label style={{ display: 'block', marginBottom: 8 }}>Upload File (Optional)</label>
        <input 
          type="file" 
          className="form-control" 
          style={{ width: '100%', marginBottom: 24 }}
          onChange={e => setFile(e.target.files[0])}
        />
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={submitting || enrollStatus !== 'success'}
        >
          {submitting ? 'Submitting...' : 'Submit Assignment'}
        </button>
        {submitError && <p className="label" style={{ color: 'var(--danger)', marginTop: 12 }}>{submitError}</p>}
        {enrollStatus !== 'success' && <p className="muted" style={{ marginTop: 12 }}>You must be enrolled to submit.</p>}
      </form>
    </Card>
  );
};

export const ActivityDetailsPage = () => {
  const { id } = useParams();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollStatus, setEnrollStatus] = useState(null);

  useEffect(() => {
    activityService.getById(id)
      .then(data => setActivity(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleEnroll = async () => {
    setEnrollStatus('loading');
    try {
      await submissionService.enroll(id);
      setEnrollStatus('success');
    } catch (error) {
      setEnrollStatus('error');
    }
  };

  if (loading) return <main className="page"><p className="muted">Loading activity...</p></main>;
  if (!activity) return <main className="page"><p className="muted">Activity not found.</p></main>;

  return (
    <main className="page">
      <div className="split">
        <section className="grid">
          <Card>
            <div className="chips">
              <Badge tone="badge-primary">{activity.difficulty || 'Intermediate'}</Badge>
              <Badge>{activity.estimatedTime || activity.time || 15} min</Badge>
              {activity.skills && <Badge>{activity.skills.length} skills</Badge>}
            </div>
            <h1 className="title-xl" style={{ marginTop: 24 }}>{activity.title}</h1>
            <p className="lead">{activity.description}</p>
            {activity.skills && (
              <>
                <div className="label" style={{ marginTop: 36 }}>Skills Acquired</div>
                <div className="chips" style={{ marginTop: 12 }}>{activity.skills.map((skill) => <span className="chip" key={skill}>{skill}</span>)}</div>
              </>
            )}
          </Card>
          {activity.type?.toUpperCase() === 'ASSIGNMENT' ? (
            <SubmissionSection activityId={activity._id || activity.id} enrollStatus={enrollStatus} />
          ) : (
            <Card>
              <h2>Course Progress</h2>
              <p className="lead">12 of 18 lessons completed <span className="primary" style={{ float: 'right', fontWeight: 800 }}>{activity.progress || 0}%</span></p>
              <ProgressBar value={activity.progress || 0} className="progress-lg" />
            </Card>
          )}
        </section>
        <aside className="grid">
          <Card>
            {enrollStatus === 'success' ? (
              <Link to={`/student/quiz/${activity._id || activity.id}`} className="btn btn-primary full" style={{ minHeight: 78, fontSize: 22 }}>Continue Activity ▶</Link>
            ) : (
              <button 
                onClick={handleEnroll} 
                disabled={enrollStatus === 'loading'}
                className="btn btn-primary full" 
                style={{ minHeight: 78, fontSize: 22 }}
              >
                {enrollStatus === 'loading' ? 'Enrolling...' : 'Start Activity ▶'}
              </button>
            )}
            {enrollStatus === 'error' && <p className="label" style={{ color: 'var(--danger)', textAlign: 'center', marginTop: 12 }}>Failed to enroll.</p>}
            <p className="lead" style={{ textAlign: 'center', marginTop: 12 }}>Estimated completion: {activity.estimatedTime || activity.time || 15} mins</p>
          </Card>
          <Card>
            <div className="label" style={{ textAlign: 'center' }}>Momentum Preview</div>
            <div className="surface" style={{ padding: 22, marginTop: 24 }}>Effort<br /><strong>{activity.estimatedTime || activity.time || 15} Min Session</strong></div>
            <div className="surface" style={{ padding: 22, marginTop: 20, borderColor: '#c3c0ff' }}>Reward<br /><strong className="primary">+{activity.xpReward || activity.xp || 100} XP</strong></div>
            <div className="surface" style={{ padding: 22, marginTop: 20 }}>Progress<br /><strong>Level up possible</strong></div>
          </Card>
        </aside>
      </div>
    </main>
  );
};

export const QuizAttemptPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  return (
    <main className="quiz-page">
      <header className="topbar"><div className="brand">Katalyst</div><button className="nav-link" onClick={() => navigate('/student/learn')}>Exit ×</button></header>
      <section className="quiz-shell">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
          <div><div className="label">SQL Fundamentals</div><h1 className="title-md">Question 4 of 10</h1></div>
          <Badge>12:45 remaining</Badge>
        </div>
        <ProgressBar value={42} />
        <Card className="question-card" style={{ marginTop: 58 }}>
          <h2 className="title-md">Which SQL clause is used to filter grouped results?</h2>
          <div className="answers">
            {['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'].map((answer) => <button className={`answer ${answer === 'HAVING' ? 'selected' : ''}`} key={answer} onClick={() => answer === 'HAVING' && navigate(`/student/quiz/${id}/result`)}>{answer}<span>○</span></button>)}
          </div>
        </Card>
      </section>
    </main>
  );
};

export const QuizResultPage = () => (
  <main className="page page-narrow">
    <div style={{ textAlign: 'center' }}>
      <div className="eyebrow">SQL Fundamentals · Quiz Complete</div>
      <h1 className="title-lg">Great work!</h1>
      <div className="ring-score"><span>82%</span></div>
      <div className="grid grid-4"><MetricCard label="Questions" value="10" /><MetricCard label="Correct" value="8" tone="teal" /><MetricCard label="Incorrect" value="2" tone="orange" /><MetricCard label="Time" value="08:42" /></div>
    </div>
    <div className="grid grid-2" style={{ marginTop: 42 }}>
      <div className="grid">
        <Card><h2>XP Earned <Badge tone="badge-primary">+100 XP</Badge></h2><h3 className="primary">Level 4</h3><ProgressBar value={82} /><p className="muted">180 XP to Level 5</p></Card>
        <Card><h2>Skill Breakdown</h2>{[['SQL Basics',92],['Joins',86],['Aggregation',61]].map(([skill,value]) => <div className="surface" style={{ padding: 16, marginTop: 12 }} key={skill}><strong>{skill}</strong><span style={{ float: 'right' }}>{value}%</span><ProgressBar value={value} /></div>)}</Card>
      </div>
      <div className="grid">
        <Card style={{ textAlign: 'center' }}><div className="eyebrow">Achievement Unlocked</div><div className="ring-score" style={{ width: 150, height: 150 }}><span style={{ width: 110, height: 110, fontSize: 20 }}>◇</span></div><h2>SQL Explorer</h2><p className="lead">Awarded for completing your first database fundamentals module with a score above 80%.</p></Card>
        <Card><div className="eyebrow">Up Next</div><h2>Advanced SQL Challenge</h2><p className="muted">Focus on complex joins, subqueries and window functions.</p><Link className="btn btn-primary" to="/student/learn">Continue Learning →</Link></Card>
      </div>
    </div>
  </main>
);

export const ProgressPage = () => {
  const { stats, loading: statsLoading } = useUserStats();
  const [analytics, setAnalytics] = React.useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = React.useState(true);

  React.useEffect(() => {
    import('../../services/analyticsService').then(({ analyticsService }) => {
      analyticsService.getStudentAnalytics()
        .then(res => setAnalytics(res))
        .catch(console.error)
        .finally(() => setLoadingAnalytics(false));
    });
  }, []);

  const level = stats?.level || 1;
  const xp = stats?.xp || 0;
  const streak = stats?.streak || 0;
  const nextXp = stats?.nextLevelXp || 180;
  const xpLeft = Math.max(0, nextXp - xp);
  const loading = statsLoading || loadingAnalytics;

  return (
    <main className="page">
      <h1 className="title-lg">Your Progress</h1>
      <p className="lead">Track your momentum, unlock achievements, and chart your course forward.</p>
      <div className="grid grid-3" style={{ marginTop: 44 }}>
        <MetricCard label="Current Status" value={loading ? '-' : `Level ${level}`} helper={`${xp} XP · ${xpLeft} to Lvl ${level + 1}`} />
        <MetricCard label="Momentum" value={loading ? '-' : `${streak} Day Streak`} helper="Complete an activity today to keep it going." />
        <MetricCard label="Milestones" value={loading ? '-' : `${stats?.activitiesCompleted || 0} Completed`} helper={`+${stats?.activitiesCompletedThisWeek || 0} activities this week.`} />
      </div>
      <div className="grid grid-2" style={{ marginTop: 28 }}>
        <Card>
          <h2>XP Growth</h2>
          {loadingAnalytics ? <div className="media-thumb" style={{ minHeight: 260 }} /> : <XpGrowthChart data={analytics?.xpGrowth} />}
        </Card>
        <Card><h2>Skill Map</h2><div className="skill-map"><span style={{ left: '47%', top: '42%' }}>Java</span><span style={{ left: '67%', top: '24%', background: 'var(--teal)' }}>SQL</span><span style={{ left: '33%', top: '60%', background: '#35c9ef' }}>React</span><span style={{ left: '61%', top: '60%', background: '#777587' }}>Algo</span></div></Card>
      </div>
      <section className="card card-pad" style={{ marginTop: 48, background: 'linear-gradient(100deg, var(--primary), var(--teal))', color: '#fff' }}>
        <h2 className="title-md">Next Goal: Reach Level {level + 1}</h2>
        <p className="lead" style={{ color: '#fff' }}>You only need {xpLeft} XP. Keep your momentum going.</p>
        <Link className="btn" to="/student/learn">Explore Learn →</Link>
      </section>
    </main>
  );
};

export const ProfilePage = () => {
  const { user } = useAuth();
  const { stats } = useUserStats();
  const { achievements } = useAchievements();
  const level = stats?.level || 1;
  const xp = stats?.xp || 0;
  const streak = stats?.streak || 0;
  const progress = stats?.nextLevelXp ? Math.min(100, (xp / stats.nextLevelXp) * 100) : 0;

  // TODO: replace with real API once backend team ships getLearningJourney endpoint
  const journey = [
    ['Earned "Fast Learner" Badge', 'Completed 5 activities in one day.', '2d ago'],
    ['Reached Level 4', 'Unlocked Advanced SQL module.', '1w ago'],
    ['Joined Team "Data Mavericks"', 'Started collaborating on group challenges.', '2w ago']
  ];

  return (
    <main className="page">
      <div className="split">
        <aside className="grid">
          <Card style={{ textAlign: 'center' }}><img className="avatar avatar-ring" style={{ width: 116, height: 116 }} src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'S'}&background=random`} alt="" /><h1>{user?.name || 'Student'}</h1><p>{user?.role || 'Learner'}</p><ProgressBar value={progress} /></Card>
          <div className="grid grid-2"><MetricCard label="Current Streak" value={`${streak} Days`} /><MetricCard label="Activities" value={`${stats?.activitiesCompleted || 0}`} /></div>
          <MetricCard label="Lifetime Experience" value={`${xp.toLocaleString()} XP`} />
          <Card><p>Edit Profile ›</p><p>Preferences ›</p><p className="orange">Logout</p></Card>
        </aside>
        <section className="grid">
          <Card><h2 className="title-md">Learning Journey</h2>{journey.map(([title, body, time]) => <div style={{ padding: '18px 0', borderTop: '1px solid var(--line)' }} key={title}><strong className="primary">{title}</strong><span className="muted" style={{ float: 'right' }}>{time}</span><p>{body}</p></div>)}</Card>
          <div className="grid grid-2">
            <Card><h2>Skills Radar</h2>{[['SQL',92],['Java',86],['Database Design',75]].map(([skill,value]) => <p key={skill}><strong>{skill}</strong><span className="primary" style={{ float: 'right' }}>{value}%</span><ProgressBar value={value} /></p>)}</Card>
            <Card><h2>Summary</h2><div className="grid grid-2"><MetricCard label="Courses" value={`${stats?.activitiesCompleted || 0}`} /><MetricCard label="Avg Score" value="94%" /></div></Card>
          </div>
          <div className="grid grid-2">
            <Card>
              <h2>Achievements</h2>
              <div className="chips">
                {achievements.length > 0 ? achievements.slice(0, 5).map(a => <span className="chip" key={a.name || a.id}>{a.name || a.title}</span>) : <span className="muted">No achievements yet</span>}
              </div>
            </Card>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ margin: 0 }}>Certificates</h2>
                <Link className="primary" to="/student/certificates">View all</Link>
              </div>
              <p className="muted">Manage your verified accomplishments and external credentials.</p>
              <Link className="btn" to="/student/certificates" style={{ marginTop: 12, display: 'inline-block' }}>Manage Certificates</Link>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
};

export const CertificatePage = () => {
  const { user } = useAuth();
  return (
  <main className="page page-narrow">
    <div style={{ textAlign: 'center', marginBottom: 34 }}><div className="eyebrow teal">Credential Earned</div><h1 className="title-md">Your verified accomplishment</h1></div>
    <section className="card certificate">
      <div className="certificate-inner">
        <Badge>Katalyst</Badge>
        <div className="eyebrow" style={{ marginTop: 90 }}>Certificate of Completion</div>
        <p className="lead"><em>This is to proudly certify that</em></p>
        <h2 className="title-lg">{user?.name || 'Student'}</h2>
        <p className="lead"><em>has successfully completed the requirements and mastered</em></p>
        <h3 className="title-md primary">Database Fundamentals</h3>
        <div className="grid grid-3" style={{ marginTop: 100, textAlign: 'left' }}><strong>Date of Issue<br />October 26, 2023</strong><strong>Credential ID<br />KAT-DBF-9482X</strong><strong>Verified<br />Director of Learning</strong></div>
      </div>
    </section>
    <div className="chips" style={{ justifyContent: 'center', marginTop: 28 }}><button className="btn btn-primary">Download PDF</button><button className="btn">Share Link</button><button className="btn">Add to LinkedIn</button></div>
  </main>
  );
};
