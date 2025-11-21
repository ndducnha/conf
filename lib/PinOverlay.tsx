'use client';
import React from 'react';
import { usePinnedParticipant } from './PinnedParticipantContext';

export default function PinOverlay() {
  // Attempt to dynamically require the participant hook from the livekit components package.
  // This avoids hard compile-time dependency on an exact hook name and prevents hook ordering errors.
  let useParticipantHook: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const livekit = require('@livekit/components-react');
    useParticipantHook = livekit.useParticipant || livekit.useParticipantContext || null;
  } catch (e) {
    useParticipantHook = null;
  }

  const participant = (() => {
    try {
      if (useParticipantHook) {
        return useParticipantHook();
      }
    } catch (e) {
      // ignore
    }
    return null;
  })();

  const { pinnedIdentity, setPinnedIdentity } = (() => {
    try {
      return usePinnedParticipant();
    } catch (e) {
      return { pinnedIdentity: null, setPinnedIdentity: () => {} } as any;
    }
  })();

  if (!participant || !participant.identity) return null;

  const isPinned = pinnedIdentity === participant.identity;

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    const already = pinnedIdentity === participant.identity;
    setPinnedIdentity(already ? null : participant.identity);
  };

  return (
    <button
      onClick={handleTogglePin}
      title={isPinned ? 'Unpin participant' : 'Pin participant'}
      className="lk-pin-overlay"
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        background: isPinned ? 'var(--vcyber-success-bg)' : 'rgba(0,0,0,0.6)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: 'white',
        padding: '0.5rem',
        borderRadius: '999px',
        opacity: 0,
        pointerEvents: 'none',
        transition: 'opacity 160ms ease-in-out',
        cursor: 'pointer',
        zIndex: 30,
      }}
    >
      {isPinned ? '🔒' : '📌'}
      <style jsx>{`
        .lk-pin-overlay {
          width: 44px;
          height: 44px;
          font-size: 18px;
        }
        :global(.tile-with-pin:hover) .lk-pin-overlay {
          opacity: 1 !important;
          pointer-events: auto !important;
        }
      `}</style>
    </button>
  );
}
