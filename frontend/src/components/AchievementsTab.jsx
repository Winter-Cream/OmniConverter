import React, { useEffect, useMemo, useState } from 'react';
import { Award, CheckCircle2, LockKeyhole, Sparkles, Target, Trophy, X } from 'lucide-react';
import { translateUiCopy } from '../utils/translations';

export default function AchievementsTab({ stats, lang = 'en' }) {
  const tr = (text) => translateUiCopy(text, lang);
  const filesConverted = Number(stats?.filesConverted) || 0;
  const level = Math.max(1, Number(stats?.level) || 1);
  const xp = Math.max(0, Number(stats?.xp) || 0);
  const nextLevelXp = level * 200;
  const xpRemaining = Math.max(0, nextLevelXp - xp);
  const xpPercent = Math.min(100, Math.round((xp / nextLevelXp) * 100));

  const quests = [
    { id: 'first_conv', title: 'First Step', desc: 'Convert your first file using OmniConverter', xpReward: 50, total: 1 },
    { id: 'batch_5', title: 'Batch Initiate', desc: 'Convert 5 files across any formats', xpReward: 100, total: 5 },
    { id: 'batch_25', title: 'Conversion Enthusiast', desc: 'Process 25 conversion jobs', xpReward: 250, total: 25 },
    { id: 'century', title: 'Centurion Master', desc: 'Convert 100 total documents, media, or tables', xpReward: 500, total: 100 },
  ].map((quest) => ({ ...quest, progress: Math.min(quest.total, filesConverted), completed: filesConverted >= quest.total }));

  const badges = [
    { id: 'novice', name: 'Omni Novice', desc: 'Started your file conversion journey', icon: '🌱', rarity: 'Common', unlocked: filesConverted >= 1 },
    { id: 'apprentice', name: 'Format Apprentice', desc: 'Completed 10 file conversions', icon: '⚡', rarity: 'Uncommon', unlocked: filesConverted >= 10 },
    { id: 'pdf_ninja', name: 'PDF Ninja', desc: 'Level 2 Explorer reached', icon: '📄', rarity: 'Uncommon', unlocked: level >= 2 },
    { id: 'alchemist', name: 'Data Alchemist', desc: 'Level 5 Explorer reached', icon: '🔮', rarity: 'Epic', unlocked: level >= 5 },
    { id: 'speedster', name: 'Speed Demon', desc: 'Processed over 1 MB of data', icon: '🚀', rarity: 'Rare', unlocked: (Number(stats?.bytesProcessed) || 0) > 1024 * 1024 },
    { id: 'legend', name: 'Omni Legend', desc: 'Reached Level 10 Explorer status', icon: '👑', rarity: 'Legendary', unlocked: level >= 10 },
  ];

  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [celebration, setCelebration] = useState(false);
  const nextQuest = quests.find((quest) => !quest.completed);
  const visibleBadges = useMemo(() => badges.filter((badge) => filter === 'all' || (filter === 'unlocked' ? badge.unlocked : !badge.unlocked)), [filter, filesConverted, level, stats?.bytesProcessed]);

  // Keep a per-browser record so a new unlock is celebrated once, not on every render.
  useEffect(() => {
    const key = 'omniconverter.achievement-unlocks.v1';
    const current = badges.filter((badge) => badge.unlocked).map((badge) => badge.id);
    try {
      const saved = localStorage.getItem(key);
      if (saved === null) localStorage.setItem(key, JSON.stringify(current));
      else {
        const previous = new Set(JSON.parse(saved));
        if (current.some((id) => !previous.has(id))) {
          setCelebration(true);
          const timeout = window.setTimeout(() => setCelebration(false), 3200);
          localStorage.setItem(key, JSON.stringify(current));
          return () => window.clearTimeout(timeout);
        }
        localStorage.setItem(key, JSON.stringify(current));
      }
    } catch { /* Storage can be disabled; achievements still work without celebration persistence. */ }
  }, [filesConverted, level, stats?.bytesProcessed]);

  useEffect(() => {
    if (!selected) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected]);

  const panel = { background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', padding: '1.2rem' };
  const muted = { color: 'var(--text-secondary)' };
  const rarityColors = { Common: 'var(--text-secondary)', Uncommon: 'var(--emerald-500)', Rare: 'var(--brand-500)', Epic: '#b37aff', Legendary: 'var(--amber-500)' };
  const progress = (percent, color = 'var(--brand-500)') => (
    <div className="achievement-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={percent}>
      <div className="achievement-fill" style={{ width: `${percent}%`, background: color }} />
    </div>
  );

  return (
    <div className="achievement-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <style>{`.achievement-page .achievement-track{height:7px;border-radius:999px;background:var(--bg-subtle);overflow:hidden}.achievement-page .achievement-fill{height:100%;border-radius:inherit;transition:width .35s ease}.achievement-page .achievement-card{color:var(--text-primary);font:inherit;transition:transform .18s ease,border-color .18s ease}.achievement-page .achievement-card:hover{transform:translateY(-2px)}.achievement-page button:focus-visible{outline:2px solid var(--brand-500);outline-offset:2px}@media(prefers-reduced-motion:reduce){.achievement-page *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}`}</style>
      <section className="achievement-hero" style={{ position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '1.25rem', padding: 'clamp(1.2rem,3vw,2rem)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,.38)', background: 'radial-gradient(ellipse at 85% 10%, rgba(99,102,241,.25), transparent 48%), linear-gradient(120deg,var(--bg-card),rgba(99,102,241,.08))' }}>
        <div style={{ position: 'relative', zIndex: 1 }}><div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', color: 'var(--brand-500)', fontSize: '.72rem', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}><Sparkles size={14} />{tr('Achievement Journey')}</div><h2 style={{ margin: '.45rem 0', fontSize: 'clamp(1.25rem,3vw,1.8rem)' }}>{tr('Explorer Status')} · {tr(`Level ${level}`)}</h2><p style={{ ...muted, margin: 0, maxWidth: '38rem', fontSize: '.9rem' }}>{tr('Keep converting to earn XP, complete milestones, and unlock rare badges.')}</p><div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '1rem' }}><span className="badge badge-neutral">{filesConverted.toLocaleString()} {tr('files converted')}</span><span className="badge badge-neutral">{badges.filter((b) => b.unlocked).length} / {badges.length} {tr('badges unlocked')}</span></div></div>
        <div aria-label={`${xpPercent}% ${tr('XP Progress')}`} style={{ width: 'clamp(5.5rem,12vw,7rem)', aspectRatio: '1', borderRadius: '50%', padding: '7px', background: `conic-gradient(var(--brand-500) ${xpPercent}%,var(--bg-subtle) ${xpPercent}%)`, boxShadow: '0 0 32px rgba(99,102,241,.18)' }}><div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg-card)', display: 'grid', placeContent: 'center', textAlign: 'center' }}><strong style={{ fontSize: '1.2rem' }}>{xpPercent}%</strong><span style={{ ...muted, fontSize: '.62rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>XP</span></div></div>
      </section>
      <div className="achievement-overview" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,230px),1fr))', gap: '.9rem' }}>
        <section className="glass-panel" style={{ ...panel, display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}><Award color="var(--brand-500)" /><div><div style={{ ...muted, fontSize: '.73rem', textTransform: 'uppercase', fontWeight: 700 }}>{tr('Explorer Status')}</div><strong style={{ fontSize: '1.25rem' }}>{tr(`Level ${level}`)}</strong></div></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem', fontSize: '.78rem' }}><span>{tr('XP Progress')}</span><strong>{xp} / {nextLevelXp} XP</strong></div>
          {progress(xpPercent)}
          <div style={{ ...muted, fontSize: '.75rem' }}>{xpRemaining} {tr('XP to next level')}</div>
        </section>
        <section className="glass-panel" style={{ ...panel, display: 'flex', alignItems: 'center', gap: '.75rem' }}><Target color="var(--emerald-500)" /><div><div style={{ ...muted, fontSize: '.73rem', textTransform: 'uppercase', fontWeight: 700 }}>{tr('Completed Milestones')}</div><strong style={{ fontSize: '1.25rem' }}>{quests.filter((q) => q.completed).length} / {quests.length}</strong></div></section>
        <section className="glass-panel" style={{ ...panel, display: 'flex', alignItems: 'center', gap: '.75rem' }}><Trophy color="var(--amber-500)" /><div><div style={{ ...muted, fontSize: '.73rem', textTransform: 'uppercase', fontWeight: 700 }}>{tr('Badges Collected')}</div><strong style={{ fontSize: '1.25rem' }}>{badges.filter((b) => b.unlocked).length} / {badges.length}</strong></div></section>
      </div>

      <section className="glass-panel" style={panel}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '.5rem', margin: '0 0 1rem', fontSize: '1rem' }}><Target size={18} color="var(--brand-500)" />{tr('Milestones & Goals')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,250px),1fr))', gap: '.8rem' }}>
          {quests.map((quest, index) => {
            const percent = Math.round((quest.progress / quest.total) * 100);
            const isNext = nextQuest?.id === quest.id;
            return <button key={quest.id} type="button" className="achievement-card" onClick={() => setSelected({ type: 'milestone', item: quest })} aria-label={`${tr('View details')}: ${tr(quest.title)}`} style={{ ...panel, position: 'relative', overflow: 'hidden', textAlign: 'left', cursor: 'pointer', borderColor: quest.completed ? 'var(--emerald-500)' : isNext ? 'var(--brand-500)' : 'var(--border-card)', display: 'flex', flexDirection: 'column', gap: '.65rem', boxShadow: isNext ? '0 0 0 1px rgba(99,102,241,.12),0 8px 24px rgba(99,102,241,.08)' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.6rem', alignItems: 'start' }}><div style={{ display: 'flex', gap: '.55rem' }}><span style={{ display: 'grid', placeItems: 'center', flex: '0 0 1.8rem', width: '1.8rem', height: '1.8rem', borderRadius: '50%', background: quest.completed ? 'rgba(16,185,129,.15)' : 'var(--bg-subtle)', color: quest.completed ? 'var(--emerald-500)' : 'var(--text-secondary)', fontSize: '.75rem', fontWeight: 800 }}>{quest.completed ? <CheckCircle2 size={15} /> : String(index + 1).padStart(2, '0')}</span><div><strong>{tr(quest.title)}</strong><div style={{ ...muted, fontSize: '.78rem', marginTop: '.25rem' }}>{tr(quest.desc)}</div></div></div><span className={`badge ${quest.completed ? 'badge-emerald' : 'badge-neutral'}`} style={{ whiteSpace: 'nowrap' }}>+{quest.xpReward} XP</span></div>
              {isNext && <span style={{ color: 'var(--brand-500)', fontSize: '.72rem', fontWeight: 700 }}>{tr('Next milestone')}</span>}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem' }}><span>{tr('Progress')}</span><strong>{quest.progress} / {quest.total} · {percent}%</strong></div>
              {progress(percent, quest.completed ? 'var(--emerald-500)' : undefined)}
              <div style={{ ...muted, fontSize: '.72rem' }}>{quest.completed ? tr('Completed') : `${quest.total - quest.progress} ${tr('remaining')}`}</div>
            </button>;
          })}
        </div>
      </section>

      <section className="glass-panel" style={panel}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem', marginBottom: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '.5rem', margin: 0, fontSize: '1rem' }}><Trophy size={18} color="var(--amber-500)" />{tr('Earned Badges')}</h3>
          <div role="group" aria-label={tr('Badge filters')} style={{ display: 'flex', gap: '.4rem' }}>{[['all', 'All'], ['unlocked', 'Unlocked'], ['locked', 'Locked']].map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={filter === value ? 'btn-primary' : 'btn-secondary'} style={{ padding: '.4rem .7rem', fontSize: '.75rem' }}>{tr(label)}</button>)}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,155px),1fr))', gap: '.7rem' }}>
          {visibleBadges.map((badge) => <button key={badge.id} type="button" className="achievement-card" onClick={() => setSelected({ type: 'badge', item: badge })} aria-label={`${tr('View details')}: ${tr(badge.name)}`} style={{ ...panel, position: 'relative', overflow: 'hidden', padding: '.9rem', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.45rem', borderColor: badge.unlocked ? rarityColors[badge.rarity] : 'var(--border-card)', opacity: badge.unlocked ? 1 : .72, boxShadow: badge.unlocked ? `inset 0 2px ${rarityColors[badge.rarity]}` : undefined }}>
            <span style={{ color: rarityColors[badge.rarity], fontSize: '.62rem', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>{tr(badge.rarity)}</span>
            <span aria-hidden="true" style={{ fontSize: '1.8rem', filter: badge.unlocked ? 'none' : 'grayscale(1)' }}>{badge.icon}</span>
            <strong style={{ fontSize: '.84rem' }}>{tr(badge.name)}</strong><span style={{ ...muted, fontSize: '.73rem' }}>{tr(badge.desc)}</span>
            <span className={`badge ${badge.unlocked ? 'badge-amber' : 'badge-neutral'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '.25rem' }}>{badge.unlocked ? <CheckCircle2 size={12} /> : <LockKeyhole size={12} />}{tr(badge.unlocked ? 'Unlocked' : 'Locked')}</span>
          </button>)}
        </div>
      </section>

      {celebration && <div role="status" aria-live="polite" style={{ position: 'fixed', zIndex: 1000, right: '1rem', bottom: '1rem', padding: '.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--amber-500)', boxShadow: 'var(--shadow-lg)' }}>🏆 {tr('Badge unlocked!')}</div>}
      {selected && <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,.55)', display: 'grid', placeItems: 'center', padding: '1rem' }}>
        <section role="dialog" aria-modal="true" aria-labelledby="achievement-dialog-title" className="glass-panel" style={{ ...panel, width: 'min(100%,420px)', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '.8rem' }}><div><div style={{ fontSize: '1.7rem' }}>{selected.item.icon || (selected.type === 'milestone' ? '🎯' : '🏆')}</div><h3 id="achievement-dialog-title" style={{ margin: '.35rem 0' }}>{tr(selected.item.title || selected.item.name)}</h3></div><button type="button" onClick={() => setSelected(null)} aria-label={tr('Close')} className="btn-secondary"><X size={17} /></button></div>
          <p style={{ ...muted, lineHeight: 1.5 }}>{tr(selected.item.desc)}</p>
          {selected.type === 'milestone' ? <><div style={{ fontSize: '.85rem', margin: '.6rem 0' }}>{tr('Progress')}: {selected.item.progress} / {selected.item.total} · {Math.round(selected.item.progress / selected.item.total * 100)}%</div><div style={{ fontSize: '.85rem' }}>{tr('Reward')}: +{selected.item.xpReward} XP</div></> : <div style={{ fontSize: '.85rem' }}>{tr('Status')}: {tr(selected.item.unlocked ? 'Unlocked' : 'Locked')}</div>}
        </section>
      </div>}
    </div>
  );
}
