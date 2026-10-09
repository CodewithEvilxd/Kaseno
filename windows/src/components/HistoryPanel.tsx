import React from 'react';
import { History, Undo2, Redo2, Clock } from 'lucide-react';
import { HistoryState } from '../types/kaseno';

interface HistoryPanelProps {
  history: HistoryState[];
  currentIndex: number;
  onJumpToState: (index: number) => void;
  onUndo: () => void;
  onRedo: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  currentIndex,
  onJumpToState,
  onUndo,
  onRedo,
}) => {
  return (
    <div className="panel-section" style={{ height: 160, display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-subtle)' }}>
      {/* Panel Header */}
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <History size={13} color="var(--text-muted)" />
          <span style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>History</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            className="tool-button"
            style={{ width: 22, height: 22 }}
            disabled={currentIndex <= 0}
            onClick={onUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={12} />
          </button>
          <button
            type="button"
            className="tool-button"
            style={{ width: 22, height: 22 }}
            disabled={currentIndex >= history.length - 1}
            onClick={onRedo}
            title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
          >
            <Redo2 size={12} />
          </button>
        </div>
      </div>

      {/* History states list */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-panel)' }}>
        {history.map((state, idx) => {
          const isActive = idx === currentIndex;
          const isUndone = idx > currentIndex;

          return (
            <div
              key={idx}
              onClick={() => onJumpToState(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 12px',
                fontSize: 11.5,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                background: isActive ? 'var(--bg-surface-active)' : 'transparent',
                color: isUndone ? 'var(--text-dim)' : isActive ? 'var(--accent)' : 'var(--text-main)',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                opacity: isUndone ? 0.5 : 1,
                transition: 'all 0.1s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'var(--bg-surface)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <Clock size={11} style={{ opacity: 0.6, flexShrink: 0 }} />
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: isActive ? 600 : 400 }}>
                {state.actionName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
