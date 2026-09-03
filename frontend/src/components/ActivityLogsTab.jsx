import React, { useState } from 'react';
import { 
  Clock, 
  Trash2, 
  RotateCcw, 
  Search, 
  FileText, 
  CheckCircle2, 
  HardDrive, 
  Zap, 
  FileBox 
} from 'lucide-react';
import { clearServerHistory, deleteServerHistoryItem, resetServerStats } from '../services/api';
import { playSound } from '../utils/audio';

export default function ActivityLogsTab({ stats, refreshStats, sfx }) {
  const [searchTerm, setSearchTerm] = useState('');
  const history = stats?.history || [];

  const filteredHistory = history.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(term)) ||
      (item.target && item.target.toLowerCase().includes(term))
    );
  });

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all conversion activity logs?')) return;
    playSound('click', sfx);
    await clearServerHistory();
    refreshStats();
  };

  const handleDeleteItem = async (index) => {
    playSound('click', sfx);
    await deleteServerHistoryItem(index);
    refreshStats();
  };

  const handleResetStats = async () => {
    if (!window.confirm('Reset all statistics and gamification XP to zero?')) return;
    playSound('click', sfx);
    await resetServerStats();
    refreshStats();
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Stats Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--brand-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileBox size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Total Converted
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {stats?.filesConverted || 0}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <HardDrive size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Data Processed
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {formatBytes(stats?.bytesProcessed)}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Total Explorer XP
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>
              {stats?.xp || 0} XP
            </div>
          </div>
        </div>
      </div>

      {/* History Table Container */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-card)',
          paddingBottom: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Clock size={20} color="#10b981" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>
              Activity & Conversion Log
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Filter logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '0.4rem 0.65rem 0.4rem 2rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem'
                }}
              />
            </div>

            <button
              onClick={handleClearHistory}
              disabled={history.length === 0}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
            >
              <Trash2 size={13} />
              <span>Clear Log</span>
            </button>

            <button
              onClick={handleResetStats}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', color: '#f43f5e' }}
            >
              <RotateCcw size={13} />
              <span>Reset Stats</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid var(--border-card)',
                color: 'var(--text-secondary)',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase'
              }}>
                <th style={{ padding: '0.75rem' }}>Source File</th>
                <th style={{ padding: '0.75rem' }}>Target Format</th>
                <th style={{ padding: '0.75rem' }}>Size</th>
                <th style={{ padding: '0.75rem' }}>Timestamp</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No conversions recorded yet.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item, idx) => (
                  <tr 
                    key={idx}
                    style={{
                      borderBottom: '1px solid var(--border-card)',
                      fontSize: '0.8rem'
                    }}
                  >
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={15} color="var(--brand-500)" />
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge badge-brand font-mono">
                        {item.target}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }} className="font-mono">
                      {item.size}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }} className="font-mono">
                      {item.timestamp || 'Just now'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDeleteItem(idx)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '0.25rem'
                        }}
                        title="Delete entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
