import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { playSound } from '../utils/audio';

export default function CustomSelect({
  id,
  value,
  onChange,
  options = [], // [{ value, label, badge, icon }] or array of strings
  placeholder = 'Select...',
  disabled = false,
  accentColor = 'var(--brand-500)',
  minWidth = '130px',
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
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            playSound('click', sfx);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && isOpen) {
            setIsOpen(false);
          }
        }}
        className="btn-secondary"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          padding: '0.45rem 0.75rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.8rem',
          fontWeight: 600,
          opacity: disabled ? 0.6 : 1,
          borderColor: isOpen ? accentColor : 'var(--border-card)',
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
          size={13} 
          style={{ 
            color: 'var(--text-muted)', 
            transition: 'transform 0.15s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0
          }} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            minWidth: '160px',
            maxHeight: '240px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-drop)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Optional Search */}
          {searchable && normalizedOptions.length > 6 && (
            <div style={{
              padding: '0.4rem',
              borderBottom: '1px solid var(--border-card)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'var(--bg-card)'
            }}>
              <Search size={12} style={{ color: 'var(--text-muted)' }} />
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
          <div style={{ overflowY: 'auto', padding: '0.25rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '0.65rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                No options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={String(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      padding: '0.45rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? accentColor : 'var(--text-primary)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.1s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-card-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={13} style={{ color: accentColor, flexShrink: 0 }} />}
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
