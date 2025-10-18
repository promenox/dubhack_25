/**
 * Dashboard Component
 * 
 * Main dashboard showing productivity score, metrics breakdown,
 * and recent activity events.
 */

import React from 'react';
import { useProductivity } from '../context/ProductivityContext';

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold' as const,
    marginBottom: '0.5rem',
    color: '#fff',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#999',
  },
  scoreSection: {
    backgroundColor: '#1e1e1e',
    borderRadius: '12px',
    padding: '2rem',
    marginBottom: '2rem',
    textAlign: 'center' as const,
  },
  scoreCircle: {
    width: '200px',
    height: '200px',
    margin: '0 auto',
    borderRadius: '50%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    border: '8px solid',
    position: 'relative' as const,
  },
  scoreValue: {
    fontSize: '4rem',
    fontWeight: 'bold' as const,
    lineHeight: 1,
  },
  scoreLabel: {
    fontSize: '0.875rem',
    color: '#999',
    marginTop: '0.5rem',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  metricCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    padding: '1.5rem',
  },
  metricLabel: {
    fontSize: '0.875rem',
    color: '#999',
    marginBottom: '0.5rem',
  },
  metricValue: {
    fontSize: '2rem',
    fontWeight: 'bold' as const,
    marginBottom: '0.25rem',
  },
  metricBar: {
    height: '4px',
    backgroundColor: '#333',
    borderRadius: '2px',
    overflow: 'hidden' as const,
    marginTop: '0.5rem',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  signalsSection: {
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '2rem',
  },
  signalsList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '1rem',
    marginTop: '1rem',
  },
  signalBadge: {
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  eventsSection: {
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    padding: '1.5rem',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold' as const,
    marginBottom: '1rem',
    color: '#fff',
  },
  eventsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  eventItem: {
    padding: '1rem',
    backgroundColor: '#2a2a2a',
    borderRadius: '6px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
  },
  eventType: {
    fontSize: '0.875rem',
    color: '#999',
    marginBottom: '0.25rem',
  },
  eventDescription: {
    fontSize: '1rem',
    color: '#fff',
  },
  eventTime: {
    fontSize: '0.75rem',
    color: '#666',
  },
  noData: {
    textAlign: 'center' as const,
    padding: '3rem',
    color: '#666',
    fontSize: '1.125rem',
  },
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return '#4ade80'; // Green
  if (score >= 60) return '#fbbf24'; // Yellow
  if (score >= 40) return '#fb923c'; // Orange
  return '#f87171'; // Red
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

export const Dashboard: React.FC = () => {
  const { metrics, events, lastWindow } = useProductivity();

  if (!metrics) {
    return (
      <div style={styles.container}>
        <div style={styles.noData}>
          Waiting for productivity data...
          <div style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
            Make sure tracking is enabled in Settings
          </div>
        </div>
      </div>
    );
  }

  const { score, focusScore, activityScore, contextScore, signals } = metrics;
  const scoreColor = getScoreColor(score);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>
          Your productivity metrics in real-time
        </p>
      </div>

      {/* Main Score */}
      <div style={styles.scoreSection}>
        <div 
          style={{
            ...styles.scoreCircle,
            borderColor: scoreColor,
          }}
        >
          <div style={{ ...styles.scoreValue, color: scoreColor }}>
            {score}
          </div>
          <div style={styles.scoreLabel}>Productivity Score</div>
        </div>
        <div style={{ marginTop: '1rem', color: '#999', fontSize: '0.875rem' }}>
          {signals.isProductive 
            ? 'Great work! Keep it up 🌱' 
            : signals.isIdle
            ? 'Taking a break? 🌙'
            : 'Stay focused! 💪'}
        </div>
      </div>

      {/* Metrics Breakdown */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Focus Score</div>
          <div style={{ ...styles.metricValue, color: getScoreColor(focusScore) }}>
            {focusScore}
          </div>
          <div style={styles.metricBar}>
            <div 
              style={{
                ...styles.metricBarFill,
                width: `${focusScore}%`,
                backgroundColor: getScoreColor(focusScore),
              }}
            />
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Activity Score</div>
          <div style={{ ...styles.metricValue, color: getScoreColor(activityScore) }}>
            {activityScore}
          </div>
          <div style={styles.metricBar}>
            <div 
              style={{
                ...styles.metricBarFill,
                width: `${activityScore}%`,
                backgroundColor: getScoreColor(activityScore),
              }}
            />
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Context Score</div>
          <div style={{ ...styles.metricValue, color: getScoreColor(contextScore) }}>
            {contextScore}
          </div>
          <div style={styles.metricBar}>
            <div 
              style={{
                ...styles.metricBarFill,
                width: `${contextScore}%`,
                backgroundColor: getScoreColor(contextScore),
              }}
            />
          </div>
        </div>
      </div>

      {/* Current Signals */}
      <div style={styles.signalsSection}>
        <h2 style={styles.sectionTitle}>Current Status</h2>
        <div style={styles.signalsList}>
          <div 
            style={{
              ...styles.signalBadge,
              backgroundColor: signals.hasTextFocus ? '#065f46' : '#374151',
              color: signals.hasTextFocus ? '#34d399' : '#9ca3af',
            }}
          >
            <span>{signals.hasTextFocus ? '✓' : '○'}</span>
            <span>Text Focus</span>
          </div>
          
          <div 
            style={{
              ...styles.signalBadge,
              backgroundColor: signals.isIdle ? '#713f12' : '#374151',
              color: signals.isIdle ? '#fbbf24' : '#9ca3af',
            }}
          >
            <span>{signals.isIdle ? '⏸' : '▶'}</span>
            <span>{signals.isIdle ? 'Idle' : 'Active'}</span>
          </div>

          {lastWindow && (
            <div 
              style={{
                ...styles.signalBadge,
                backgroundColor: '#1e3a8a',
                color: '#93c5fd',
              }}
            >
              <span>📱</span>
              <span>{signals.activeApp}</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent Events */}
      <div style={styles.eventsSection}>
        <h2 style={styles.sectionTitle}>Recent Activity</h2>
        {events.length === 0 ? (
          <div style={{ ...styles.noData, padding: '2rem' }}>
            No events yet. Keep working and they'll appear here!
          </div>
        ) : (
          <div style={styles.eventsList}>
            {events.slice(0, 10).map((event) => (
              <div key={event.id} style={styles.eventItem}>
                <div style={styles.eventInfo}>
                  <div style={styles.eventType}>
                    {event.type === 'focus-session' && '🎯 Focus Session'}
                    {event.type === 'break' && '☕ Break'}
                    {event.type === 'distraction' && '⚠️ Distraction'}
                    {event.type === 'milestone' && '🏆 Milestone'}
                  </div>
                  <div style={styles.eventDescription}>{event.description}</div>
                </div>
                <div style={styles.eventTime}>{formatTime(event.timestamp)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

