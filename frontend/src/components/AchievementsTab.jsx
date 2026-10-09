import React from 'react';
import { 
  Trophy, 
  Award, 
  Target 
} from 'lucide-react';

export default function AchievementsTab({ stats }) {
  const filesConverted = stats?.filesConverted || 0;
  const level = stats?.level || 1;
  const xp = stats?.xp || 0;
  const nextLevelXp = level * 200;
  const progressPercent = Math.min(100, Math.round((xp / nextLevelXp) * 100));

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        {/* Explorer Level with XP Progress Bar */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
              <Award size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Explorer Status
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                Level {level}
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }} className="font-mono">
              <span>XP Progress</span>
              <span>{xp} / {nextLevelXp} XP</span>
            </div>
            <div style={{
              height: '0.4rem',
              borderRadius: '9999px',
              background: 'var(--bg-subtle)',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: 'var(--brand-500)',
                borderRadius: '9999px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Quests Summary */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
            <Target size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Completed Milestones
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {completedQuestsCount} / {quests.length}
            </div>
          </div>
        </div>

        {/* Badges Summary */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(245, 158, 11, 0.12)',
            color: 'var(--amber-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Trophy size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Badges Collected
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {unlockedCount} / {badges.length}
            </div>
          </div>
        </div>
      </div>

      {/* Quests Panel */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Target size={16} style={{ color: 'var(--brand-500)' }} />
          <span>Milestones & Goals</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
          {quests.map(quest => (
            <div
              key={quest.id}
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-card)',
                border: '1px solid',
                borderColor: quest.completed ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-card)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.65rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{quest.title}</h4>
                  <span className={`badge ${quest.completed ? 'badge-emerald' : 'badge-neutral'}`}>
                    +{quest.xpReward} XP
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{quest.desc}</p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 600, marginBottom: '0.25rem' }} className="font-mono">
                  <span>Progress</span>
                  <span>{quest.progress} / {quest.total}</span>
                </div>
                <div style={{
                  height: '0.35rem',
                  borderRadius: '9999px',
                  background: 'var(--bg-subtle)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, Math.round((quest.progress / quest.total) * 100))}%`,
                    background: quest.completed ? 'var(--emerald-500)' : 'var(--brand-500)',
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
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Trophy size={16} style={{ color: 'var(--amber-500)' }} />
          <span>Earned Badges</span>
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.75rem'
        }}>
          {badges.map(badge => (
            <div
              key={badge.id}
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-card)',
                border: '1px solid',
                borderColor: badge.unlocked ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-card)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.45rem',
                opacity: badge.unlocked ? 1 : 0.5
              }}
            >
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                background: badge.unlocked ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                {badge.icon}
              </div>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 700 }}>{badge.name}</h4>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{badge.desc}</p>
              <span className={`badge ${badge.unlocked ? 'badge-amber' : 'badge-neutral'}`} style={{ fontSize: '0.65rem' }}>
                {badge.unlocked ? 'Unlocked' : 'Locked'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
