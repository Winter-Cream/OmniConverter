import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { playSound } from '../utils/audio';

export default function CustomSelect({
  value,
  onChange,
  options = [], // [{ value, label, badge, icon }] or array of strings
  placeholder = 'Select...',
  disabled = false,
  accentColor = 'var(--brand-500)',
  minWidth = '140px',
  searchable = false,
  sfx = true,
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Normalize options to [{ value, label, badge }]
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return {
      value: opt.value,
      label: opt.label || opt.name || opt.value,
      badge: opt.badge,
      icon: opt.icon
    };
  });

  const selectedOption = normalizedOptions.find(o => String(o.value) === String(value));

  // Click outside listener to auto-close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange(val);
    playSound('click', sfx);
    setIsOpen(false);
    setSearchTerm('');
  };

  const filteredOptions = searchable && searchTerm
    ? normalizedOptions.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : normalizedOptions;

  return (
    <div 
      ref={dropdownRef} 
      style={{ 
        position: 'relative', 
        display: 'inline-block',
        minWidth: minWidth,
        ...style 
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            playSound('click', sfx);
          }
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.65rem',
          padding: '0.65rem 0.95rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          border: '1px solid',
          borderColor: isOpen ? accentColor : 'var(--border-card)',
          color: 'var(--text-primary)',
          fontSize: '0.82rem',
          fontWeight: 700,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          boxShadow: isOpen ? `0 0 0 2px ${accentColor}33` : 'none',
          transition: 'all 0.2s ease',
          outline: 'none',
          userSelect: 'none'
        }}
      >
        <span style={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)'
        }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={14} 
          style={{ 
            color: 'var(--text-muted)', 
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0
          }} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          minWidth: '180px',
          maxHeight: '260px',
          background: 'var(--bg-surface)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-drop)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'dropdownFadeIn 0.15s ease-out'
        }}>
          {/* Optional Search */}
          {searchable && normalizedOptions.length > 6 && (
            <div style={{
              padding: '0.5rem',
              borderBottom: '1px solid var(--border-card)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'var(--bg-glass-subtle)'
            }}>
              <Search size={13} color="var(--text-muted)" />
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.75rem',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          )}

          {/* Options List */}
          <div style={{ overflowY: 'auto', padding: '0.35rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                No options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={String(opt.value)}
                    onClick={() => handleSelect(opt.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? 800 : 600,
                      color: isSelected ? accentColor : 'var(--text-primary)',
                      background: isSelected ? `${accentColor}18` : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-card-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={14} style={{ color: accentColor, flexShrink: 0 }} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
