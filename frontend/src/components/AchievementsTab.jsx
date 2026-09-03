import React from 'react';
import { 
  Trophy, 
  Award, 
  Star, 
  Target, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle, 
  Lock 
} from 'lucide-react';

export default function AchievementsTab({ stats }) {
  const filesConverted = stats?.filesConverted || 0;
  const level = stats?.level || 1;
  const xp = stats?.xp || 0;

  const quests = [
    {
      id: 'first_conv',
      title: 'First Step',
      desc: 'Convert your first file using OmniConverter',
      xpReward: 50,
      completed: filesConverted >= 1,
      progress: Math.min(1, filesConverted),
      total: 1
    },
    {
      id: 'batch_5',
      title: 'Batch Initiate',
      desc: 'Convert 5 files across any formats',
      xpReward: 100,
      completed: filesConverted >= 5,
      progress: Math.min(5, filesConverted),
      total: 5
    },
    {
      id: 'batch_25',
      title: 'Conversion Enthusiast',
      desc: 'Process 25 conversion jobs',
      xpReward: 250,
      completed: filesConverted >= 25,
      progress: Math.min(25, filesConverted),
      total: 25
    },
    {
      id: 'century',
      title: 'Centurion Master',
      desc: 'Convert 100 total documents, media, or tables',
      xpReward: 500,
      completed: filesConverted >= 100,
      progress: Math.min(100, filesConverted),
      total: 100
    }
  ];

  const badges = [
    {
      id: 'novice',
      name: 'Omni Novice',
      desc: 'Started your file conversion journey',
      icon: '🌱',
      unlocked: filesConverted >= 1
    },
    {
      id: 'apprentice',
      name: 'Format Apprentice',
      desc: 'Completed 10 file conversions',
      icon: '⚡',
      unlocked: filesConverted >= 10
    },
    {
      id: 'pdf_ninja',
      name: 'PDF Ninja',
      desc: 'Level 2 Explorer reached',
      icon: '📄',
      unlocked: level >= 2
    },
    {
      id: 'alchemist',
      name: 'Data Alchemist',
      desc: 'Level 5 Explorer reached',
      icon: '🔮',
      unlocked: level >= 5
    },
    {
      id: 'speedster',
      name: 'Speed Demon',
      desc: 'Processed over 1 MB of data',
      icon: '🚀',
      unlocked: (stats?.bytesProcessed || 0) > 1024 * 1024
    },
    {
      id: 'legend',
      name: 'Omni Legend',
      desc: 'Reached Level 10 Explorer status',
      icon: '👑',
      unlocked: level >= 10
    }
  ];

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const completedQuestsCount = quests.filter(q => q.completed).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Overview Cards */}
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
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Trophy size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Badges Unlocked
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {unlockedCount} / {badges.length}
            </div>
          </div>
        </div>

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
            <Target size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Quests Finished
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {completedQuestsCount} / {quests.length}
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
            <Award size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Explorer Level
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#10b981' }}>
              Level {level}
            </div>
          </div>
        </div>
      </div>

      {/* Quests Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Target size={18} color="var(--brand-500)" />
          <span>Active Quests & Milestones</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {quests.map(quest => (
            <div
              key={quest.id}
              style={{
                padding: '1.15rem',
                borderRadius: 'var(--radius-md)',
                background: quest.completed ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface)',
                border: '1px solid',
                borderColor: quest.completed ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-card)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 800 }}>{quest.title}</h4>
                  <span className={`badge ${quest.completed ? 'badge-emerald' : 'badge-brand'}`}>
                    +{quest.xpReward} XP
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{quest.desc}</p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.35rem' }} className="font-mono">
                  <span>Progress</span>
                  <span>{quest.progress} / {quest.total}</span>
                </div>
                <div style={{
                  height: '0.45rem',
                  borderRadius: '9999px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, Math.round((quest.progress / quest.total) * 100))}%`,
                    background: quest.completed ? '#10b981' : 'var(--brand-gradient)',
                    borderRadius: '9999px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Trophy size={18} color="#f59e0b" />
          <span>Achievements & Badges</span>
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem'
        }}>
          {badges.map(badge => (
            <div
              key={badge.id}
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: badge.unlocked ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-surface)',
                border: '1px solid',
                borderColor: badge.unlocked ? 'rgba(245, 158, 11, 0.35)' : 'var(--border-card)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: badge.unlocked ? 1 : 0.45,
                filter: badge.unlocked ? 'none' : 'grayscale(0.8)'
              }}
            >
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '50%',
                background: badge.unlocked ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-glass-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                boxShadow: badge.unlocked ? '0 0 20px -2px rgba(245, 158, 11, 0.3)' : 'none'
              }}>
                {badge.icon}
              </div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800 }}>{badge.name}</h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{badge.desc}</p>
              <span className={`badge ${badge.unlocked ? 'badge-amber' : 'badge-brand'}`} style={{ fontSize: '0.65rem' }}>
                {badge.unlocked ? 'Unlocked' : 'Locked'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
