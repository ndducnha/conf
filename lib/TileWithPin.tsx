'use client';
import React from 'react';
import { ParticipantTile } from '@livekit/components-react';
import { RemoteParticipant } from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';
import { usePinnedParticipant } from './PinnedParticipantContext';

interface TileWithPinProps {
  participant: any; // RemoteParticipant
  isLarge?: boolean;
}

export function TileWithPin({ participant, isLarge = false }: TileWithPinProps) {
  const { pinnedIdentity, setPinnedIdentity } = (() => {
    try {
      return usePinnedParticipant();
    } catch (e) {
      return { pinnedIdentity: null, setPinnedIdentity: () => {} } as any;
    }
  })();

  const isPinned = pinnedIdentity === participant.identity;

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const already = pinnedIdentity === participant.identity;
      // Local-only pin: do not broadcast. Clicking pin only affects this client.
      setPinnedIdentity(already ? null : participant.identity);
    } catch (err) {
      console.error('Failed to toggle pin', err);
    }
  };

  return (
    <div
      className={`tile-with-pin ${isLarge ? 'large' : 'small'}`}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      <div style={{ width: '100%', height: '100%' }}>
        <ParticipantTile />
      </div>

      <button
         className="pin-overlay"
        onClick={handleTogglePin}
        title={isPinned ? 'Unpin participant' : 'Pin participant'}
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
          display: 'none',
          cursor: 'pointer',
          zIndex: 10,
        }}
      >
        {isPinned ? '🔒' : '📌'}
      </button>

      <style jsx>{`
        .tile-with-pin.large .pin-overlay {
          width: 56px;
          height: 56px;
          font-size: 20px;
        }
        .tile-with-pin.small .pin-overlay {
          width: 40px;
          height: 40px;
          font-size: 16px;
        }
        .tile-with-pin:hover .pin-overlay {
          display: block;
        }
      `}</style>
    </div>
  );
}
