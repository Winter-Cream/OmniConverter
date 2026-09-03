import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  ArrowLeftRight, 
  Copy, 
  Check, 
  Database, 
  Ruler, 
  Scale, 
  Gauge, 
  Thermometer, 
  Square, 
  Beaker, 
  Clock, 
  Zap, 
  Wind,
  Sparkles,
  Equal
} from 'lucide-react';
import { UNIT_CATEGORIES, convertUnits } from '../utils/unitsData';
import { playSound } from '../utils/audio';
import CustomSelect from './CustomSelect';

const ICON_MAP = {
  database: Database,
  ruler: Ruler,
  scale: Scale,
  gauge: Gauge,
  thermometer: Thermometer,
  square: Square,
  beaker: Beaker,
  clock: Clock,
  zap: Zap,
  wind: Wind
};

export default function UnitConverterTab({ sfx }) {
  const [activeCategory, setActiveCategory] = useState('data');
  const [fromValue, setFromValue] = useState('10');
  const [fromUnit, setFromUnit] = useState('GB');
  const [toUnit, setToUnit] = useState('MB');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  // When active category changes, update default units
  useEffect(() => {
    const cat = UNIT_CATEGORIES[activeCategory];
    if (cat) {
      const keys = Object.keys(cat.units);
      if (keys.length >= 2) {
        setFromUnit(keys[4] || keys[0]);
        setToUnit(keys[3] || keys[1]);
      }
    }
  }, [activeCategory]);

  // Recalculate conversion
  useEffect(() => {
    const res = convertUnits(activeCategory, fromValue, fromUnit, toUnit);
    setResult(res);
  }, [activeCategory, fromValue, fromUnit, toUnit]);

  const handleSwap = () => {
    const prevFrom = fromUnit;
    const prevTo = toUnit;
    setFromUnit(prevTo);
    setToUnit(prevFrom);
    playSound('click', sfx);
  };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.toString());
    setCopied(true);
    playSound('click', sfx);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentCatData = UNIT_CATEGORIES[activeCategory] || UNIT_CATEGORIES.data;

  // Format unit options for CustomSelect
  const unitOptions = Object.entries(currentCatData.units).map(([key, data]) => ({
    value: key,
    label: data.name
  }));

  // Calculate 1-unit baseline formula
  const singleFormulaResult = convertUnits(activeCategory, '1', fromUnit, toUnit);
  const fromName = currentCatData.units[fromUnit]?.name || fromUnit;
  const toName = currentCatData.units[toUnit]?.name || toUnit;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Category Pills Card */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-card)',
          paddingBottom: '1rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 8px 16px -4px rgba(245, 158, 11, 0.4)'
            }}>
              <Calculator size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                Scientific Multi-Unit Converter
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                100+ precision units across 10 categories with real-time calculations.
              </p>
            </div>
          </div>

          <span className="badge badge-amber font-mono" style={{ padding: '0.35rem 0.75rem', fontSize: '0.72rem' }}>
            100+ UNITS AVAILABLE
          </span>
        </div>

        {/* Categories Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {Object.entries(UNIT_CATEGORIES).map(([catKey, cat]) => {
            const Icon = ICON_MAP[cat.icon] || Calculator;
            const isActive = activeCategory === catKey;
            return (
              <button
                key={catKey}
                onClick={() => {
                  setActiveCategory(catKey);
                  playSound('click', sfx);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: isActive ? '#f59e0b' : 'var(--border-card)',
                  background: isActive ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-glass-subtle)',
                  color: isActive ? '#d97706' : 'var(--text-secondary)',
                  boxShadow: isActive ? '0 4px 12px -2px rgba(245, 158, 11, 0.25)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <Icon size={15} style={{ color: isActive ? '#f59e0b' : 'inherit' }} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Conversion Playground Card */}
      <div className="glass-panel" style={{
        padding: '2rem',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-card)',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
          gap: '1.25rem',
          alignItems: 'center'
        }}>

          {/* Left Block: Source Input */}
          <div style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            transition: 'border-color 0.2s ease',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-secondary)'
              }}>
                From Value
              </span>
              <span className="badge badge-brand font-mono" style={{ fontSize: '0.65rem' }}>
                INPUT
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                type="number"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
                style={{
                  flex: '1 1 120px',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-primary)',
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-card)'}
              />

              <CustomSelect
                value={fromUnit}
                onChange={setFromUnit}
                options={unitOptions}
                accentColor="#f59e0b"
                searchable={true}
                minWidth="180px"
                sfx={sfx}
              />
            </div>

            {/* Quick Presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Presets:</span>
              {['1', '5', '10', '100', '1000'].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { setFromValue(val); playSound('click', sfx); }}
                  style={{
                    border: '1px solid var(--border-card)',
                    background: fromValue === val ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-surface)',
                    color: fromValue === val ? '#d97706' : 'var(--text-secondary)',
                    borderRadius: '6px',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer'
                  }}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Center Swap Button */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0.5rem' }}>
            <button
              onClick={handleSwap}
              title="Swap units"
              style={{
                width: '3.25rem',
                height: '3.25rem',
                borderRadius: '50%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-card)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'rotate(180deg) scale(1.08)';
                e.currentTarget.style.borderColor = '#f59e0b';
                e.currentTarget.style.color = '#f59e0b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                e.currentTarget.style.borderColor = 'var(--border-card)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
            >
              <ArrowLeftRight size={20} />
            </button>
          </div>

          {/* Right Block: Result Output */}
          <div style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-secondary)'
              }}>
                Converted Result
              </span>

              {result && (
                <button
                  onClick={copyResult}
                  style={{
                    border: 'none',
                    background: copied ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    color: copied ? '#10b981' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  flex: '1 1 120px',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#d97706',
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  overflowX: 'auto',
                  whiteSpace: 'nowrap'
                }}
              >
                {result || '0'}
              </div>

              <CustomSelect
                value={toUnit}
                onChange={setToUnit}
                options={unitOptions}
                accentColor="#f59e0b"
                searchable={true}
                minWidth="180px"
                sfx={sfx}
              />
            </div>

            {/* Formula Hint Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.72rem',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)'
            }}>
              <Equal size={13} color="#f59e0b" />
              <span>1 {fromUnit} = {singleFormulaResult} {toUnit}</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
