/**
 * Goals Component
 * 
 * Allows users to set, track, and manage productivity goals.
 */

import React, { useState } from 'react';
import { useProductivity } from '../context/ProductivityContext';
import type { Goal } from '../../electron/types';

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  addButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    transition: 'background-color 0.2s',
  },
  goalsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  goalCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: '12px',
    padding: '1.5rem',
    position: 'relative' as const,
  },
  goalHeader: {
    marginBottom: '1rem',
  },
  goalTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: '0.5rem',
  },
  goalType: {
    fontSize: '0.875rem',
    color: '#999',
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#333',
    borderRadius: '4px',
    overflow: 'hidden' as const,
    marginBottom: '0.75rem',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  progressText: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    color: '#999',
    marginBottom: '1rem',
  },
  goalActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  actionButton: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    cursor: 'pointer',
    flex: 1,
    fontWeight: 'bold' as const,
  },
  deleteButton: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
  },
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '500px',
    width: '90%',
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold' as const,
    marginBottom: '1.5rem',
    color: '#fff',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 'bold' as const,
    color: '#999',
  },
  input: {
    padding: '0.75rem',
    backgroundColor: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '6px',
    fontSize: '1rem',
    color: '#fff',
  },
  select: {
    padding: '0.75rem',
    backgroundColor: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '6px',
    fontSize: '1rem',
    color: '#fff',
  },
  modalActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  cancelButton: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#374151',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
  },
  submitButton: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
  },
  noGoals: {
    textAlign: 'center' as const,
    padding: '3rem',
    color: '#666',
    fontSize: '1.125rem',
  },
};

const goalTypeLabels: Record<Goal['type'], string> = {
  'daily-score': 'Daily Score',
  'weekly-hours': 'Weekly Hours',
  'focus-sessions': 'Focus Sessions',
};

export const Goals: React.FC = () => {
  const { goals, addGoal, deleteGoal } = useProductivity();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    target: 0,
    type: 'daily-score' as Goal['type'],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await addGoal({
      title: formData.title,
      target: formData.target,
      current: 0,
      type: formData.type,
    });

    setFormData({ title: '', target: 0, type: 'daily-score' });
    setShowModal(false);
  };

  const calculateProgress = (goal: Goal): number => {
    return Math.min(100, (goal.current / goal.target) * 100);
  };

  const formatDeadline = (deadline?: number): string => {
    if (!deadline) return 'No deadline';
    
    const date = new Date(deadline);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `${days} days left`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Goals</h1>
        <button 
          style={styles.addButton}
          onClick={() => setShowModal(true)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }}
        >
          + Add Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div style={styles.noGoals}>
          No goals yet. Set your first productivity goal!
        </div>
      ) : (
        <div style={styles.goalsList}>
          {goals.map((goal) => {
            const progress = calculateProgress(goal);
            const isCompleted = progress >= 100;

            return (
              <div key={goal.id} style={styles.goalCard}>
                <div style={styles.goalHeader}>
                  <h3 style={styles.goalTitle}>
                    {goal.title}
                    {isCompleted && ' ✓'}
                  </h3>
                  <div style={styles.goalType}>
                    {goalTypeLabels[goal.type]}
                  </div>
                </div>

                <div style={styles.progressBar}>
                  <div 
                    style={{
                      ...styles.progressFill,
                      width: `${progress}%`,
                      backgroundColor: isCompleted ? '#10b981' : '#3b82f6',
                    }}
                  />
                </div>

                <div style={styles.progressText}>
                  <span>
                    {goal.current} / {goal.target}
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>

                {goal.deadline && (
                  <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '1rem' }}>
                    {formatDeadline(goal.deadline)}
                  </div>
                )}

                <div style={styles.goalActions}>
                  <button
                    style={{
                      ...styles.actionButton,
                      ...styles.deleteButton,
                    }}
                    onClick={() => deleteGoal(goal.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#991b1b';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#7f1d1d';
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      {showModal && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Create New Goal</h2>
            <form style={styles.form} onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Goal Title</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Complete project documentation"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Goal Type</label>
                <select
                  style={styles.select}
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Goal['type'] })}
                >
                  <option value="daily-score">Daily Score</option>
                  <option value="weekly-hours">Weekly Hours</option>
                  <option value="focus-sessions">Focus Sessions</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Target Value</label>
                <input
                  style={styles.input}
                  type="number"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: Number(e.target.value) })}
                  placeholder="e.g., 80"
                  min="1"
                  required
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.submitButton}>
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

