import React, { useState } from 'react';
import { 
  Clock, 
  Trash2, 
  RotateCcw, 
  Search, 
  FileText, 
  HardDrive, 
  FileBox,
  Timer
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
    if (!window.confirm('Clear all conversion activity logs?')) return;
    playSound('click', sfx);
    await clearServerHistory();
    if (refreshStats) refreshStats();
  };

  const handleDeleteItem = async (index) => {
    playSound('click', sfx);
    await deleteServerHistoryItem(index);
    if (refreshStats) refreshStats();
  };

  const handleResetStats = async () => {
    if (!window.confirm('Reset all lifetime conversion counts and stats to zero?')) return;
    playSound('click', sfx);
    await resetServerStats();
    if (refreshStats) refreshStats();
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSeconds = (sec) => {
    if (!sec || sec === 0) return '0s';
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    if (mins > 0) return `${mins}m ${remainder}s`;
    return `${sec}s`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Stats Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(99, 102, 241, 0.12)',
            color: 'var(--brand-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileBox size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Total Converted
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {stats?.filesConverted || 0}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(16, 185, 129, 0.12)',
            color: 'var(--emerald-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <HardDrive size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Data Processed
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {formatBytes(stats?.bytesProcessed)}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(2, 132, 199, 0.12)',
            color: 'var(--cyan-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Timer size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Time Saved
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {formatSeconds(stats?.timeSavedSeconds || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* History Table Container */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border-card)',
          paddingBottom: '0.85rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Clock size={18} style={{ color: 'var(--brand-500)' }} />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>
              Recent Conversions
            </h3>
            <span className="badge badge-neutral font-mono">
              {history.length} {history.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Filter logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '0.4rem 0.65rem 0.4rem 1.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem',
                  width: '160px'
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleClearHistory}
              disabled={history.length === 0}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
              title="Clear all logged items"
            >
              <Trash2 size={13} />
              <span>Clear History</span>
            </button>

            <button
              type="button"
              onClick={handleResetStats}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', color: 'var(--rose-500)' }}
              title="Reset all stats to zero"
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
                <th style={{ padding: '0.65rem 0.75rem' }}>Source File</th>
                <th style={{ padding: '0.65rem 0.75rem' }}>Target Format</th>
                <th style={{ padding: '0.65rem 0.75rem' }}>Size</th>
                <th style={{ padding: '0.65rem 0.75rem' }}>Time</th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {searchTerm ? 'No activity logs matching search.' : 'No conversions recorded yet. Converted files will appear here.'}
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
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={15} style={{ color: 'var(--brand-500)' }} />
                        <span style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <span className="badge badge-neutral font-mono">
                        {item.target}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-secondary)' }} className="font-mono">
                      {item.size}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)' }} className="font-mono">
                      {item.timestamp || 'Just now'}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(idx)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '0.25rem'
                        }}
                        title="Delete entry"
                        aria-label={`Delete entry ${item.name}`}
                      >
                        <Trash2 size={13} />
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
