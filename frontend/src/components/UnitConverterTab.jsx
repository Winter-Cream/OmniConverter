import React, { useState, useMemo } from 'react';
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
  const [copied, setCopied] = useState(false);

  // Directly derive calculation in render
  const result = useMemo(() => {
    return convertUnits(activeCategory, fromValue, fromUnit, toUnit);
  }, [activeCategory, fromValue, fromUnit, toUnit]);

  const handleCategoryChange = (catKey) => {
    setActiveCategory(catKey);
    const cat = UNIT_CATEGORIES[catKey];
    if (cat) {
      const keys = Object.keys(cat.units);
      if (keys.length >= 2) {
        setFromUnit(keys[4] || keys[0]);
        setToUnit(keys[3] || keys[1]);
      }
    }
    playSound('click', sfx);
  };

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Category Pills Card */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border-card)',
          paddingBottom: '0.9rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(245, 158, 11, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--amber-500)'
            }}>
              <Calculator size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                Scientific Unit Converter
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Precision conversions across 10 categories with real-time recalculation.
              </p>
            </div>
          </div>

          <span className="badge badge-neutral font-mono" style={{ fontSize: '0.72rem' }}>
            100+ UNITS
          </span>
        </div>

        {/* Categories Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {Object.entries(UNIT_CATEGORIES).map(([catKey, cat]) => {
            const Icon = ICON_MAP[cat.icon] || Calculator;
            const isActive = activeCategory === catKey;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => handleCategoryChange(catKey)}
                className="btn-secondary"
                style={{
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.78rem',
                  background: isActive ? 'var(--bg-subtle)' : 'transparent',
                  borderColor: isActive ? 'var(--amber-500)' : 'var(--border-card)',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500
                }}
              >
                <Icon size={14} style={{ color: isActive ? 'var(--amber-500)' : 'var(--text-muted)' }} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Conversion Playground Card */}
      <div className="glass-panel" style={{
        padding: '1.5rem',
        background: 'var(--bg-surface)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          alignItems: 'center'
        }}>

          {/* Left Block: Source Input */}
          <div style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-secondary)'
              }}>
                From Value
              </span>
              <span className="badge badge-neutral font-mono" style={{ fontSize: '0.65rem' }}>
                INPUT
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <input
                type="number"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
                style={{
                  flex: '1 1 110px',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-primary)',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)'
                }}
              />

              <CustomSelect
                value={fromUnit}
                onChange={setFromUnit}
                options={unitOptions}
                accentColor="var(--amber-500)"
                searchable={true}
                minWidth="160px"
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
                  className="btn-secondary"
                  style={{
                    padding: '0.15rem 0.45rem',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    background: fromValue === val ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                    borderColor: fromValue === val ? 'var(--amber-500)' : 'var(--border-card)',
                    color: fromValue === val ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Center Swap Button */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleSwap}
              title="Swap input and output units"
              aria-label="Swap units"
              className="btn-secondary"
              style={{
                width: '2.75rem',
                height: '2.75rem',
                borderRadius: '50%',
                padding: 0
              }}
            >
              <ArrowLeftRight size={17} />
            </button>
          </div>

          {/* Right Block: Result Output */}
          <div style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-secondary)'
              }}>
                Converted Result
              </span>

              {result && (
                <button
                  type="button"
                  onClick={copyResult}
                  className="btn-secondary"
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.2rem 0.5rem',
                    color: copied ? 'var(--emerald-500)' : 'var(--text-muted)'
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  flex: '1 1 110px',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-primary)',
                  fontSize: '1.2rem',
                  fontWeight: 700,
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
                accentColor="var(--amber-500)"
                searchable={true}
                minWidth="160px"
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
              <Equal size={12} style={{ color: 'var(--amber-500)' }} />
              <span>1 {fromUnit} = {singleFormulaResult} {toUnit}</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
