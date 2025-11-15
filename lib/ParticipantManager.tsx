'use client';

import React from 'react';
import { useParticipants, useRoomContext } from '@livekit/components-react';
import { RemoteParticipant } from 'livekit-client';
import toast from 'react-hot-toast';

export function ParticipantManager() {
  const participants = useParticipants();
  const room = useRoomContext();
  const [showManager, setShowManager] = React.useState(false);
  const [waitingParticipants, setWaitingParticipants] = React.useState<string[]>([]);

  const isHost = React.useMemo(() => {
    // First participant to join is the host
    const sorted = [...participants].sort(
      (a, b) => (a.joinedAt?.getTime() || 0) - (b.joinedAt?.getTime() || 0),
    );
    return sorted[0]?.identity === room.localParticipant.identity;
  }, [participants, room.localParticipant]);

  // Handle waiting room requests
  React.useEffect(() => {
    const handleData = async (
      payload: Uint8Array,
      participant?: any,
      kind?: any,
      topic?: string,
    ) => {
      if (topic === 'waiting-room-request' && isHost) {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(payload));

        if (data.action === 'join-request') {
          setWaitingParticipants((prev) => [...prev, data.identity]);
          toast(`${data.name} wants to join`, {
            duration: 10000,
          });
        }
      }
    };

    room.on('dataReceived', handleData);
    return () => {
      room.off('dataReceived', handleData);
    };
  }, [room, isHost]);

  const handleApprove = async (identity: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(
      JSON.stringify({
        action: 'approved',
        identity,
      }),
    );

    await room.localParticipant.publishData(data, {
      reliable: true,
      topic: 'waiting-room-response',
    });

    setWaitingParticipants((prev) => prev.filter((p) => p !== identity));
    toast.success('Participant approved');
  };

  const handleDeny = async (identity: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(
      JSON.stringify({
        action: 'denied',
        identity,
      }),
    );

    await room.localParticipant.publishData(data, {
      reliable: true,
      topic: 'waiting-room-response',
    });

    setWaitingParticipants((prev) => prev.filter((p) => p !== identity));
    toast.success('Participant denied');
  };

  const handleKick = async (participant: RemoteParticipant) => {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(
        JSON.stringify({
          action: 'kick',
          identity: participant.identity,
        }),
      );

      await room.localParticipant.publishData(data, {
        reliable: true,
        topic: 'participant-control',
      });

      toast.success(`Kicked ${participant.name || participant.identity}`);
    } catch (error) {
      console.error('Error kicking participant:', error);
      toast.error('Failed to kick participant');
    }
  };

  if (!isHost) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowManager(!showManager)}
        className="lk-button participant-manage-btn"
        style={{
          position: 'fixed',
          top: '1rem',
          right: '10rem',
          zIndex: 10,
          padding: '0.5rem 1rem',
          background: 'var(--vcyber-purple-bg)',
          border: '1px solid var(--vcyber-purple-border)',
          borderRadius: '0.5rem',
        }}
      >
        👥 Manage ({participants.length})
      </button>

      {showManager && (
        <div
          className="participant-manage-panel"
          style={{
            position: 'fixed',
            top: '4rem',
            right: '1rem',
            width: '300px',
            maxHeight: '400px',
            background: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '0.5rem',
            zIndex: 100,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Participant Manager</h3>
              <button
                onClick={() => setShowManager(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                }}
              >
                ×
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            {/* Waiting Room */}
            {waitingParticipants.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4
                  style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '0.875rem',
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  Waiting Room
                </h4>
                {waitingParticipants.map((identity) => (
                  <div
                    key={identity}
                    style={{
                      padding: '0.5rem',
                      marginBottom: '0.5rem',
                      background: 'var(--vcyber-warning-bg)',
                      borderRadius: '0.25rem',
                      border: '1px solid var(--vcyber-warning-border)',
                    }}
                  >
                    <div style={{ marginBottom: '0.5rem' }}>{identity}</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleApprove(identity)}
                        className="lk-button"
                        style={{
                          flex: 1,
                          padding: '0.25rem',
                          fontSize: '0.75rem',
                          background: 'var(--vcyber-success-bg)',
                          border: '1px solid var(--vcyber-success-border)',
                        }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleDeny(identity)}
                        className="lk-button"
                        style={{
                          flex: 1,
                          padding: '0.25rem',
                          fontSize: '0.75rem',
                          background: 'var(--vcyber-danger-bg)',
                          border: '1px solid var(--vcyber-danger-border)',
                        }}
                      >
                        ✕ Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Active Participants */}
            <h4
              style={{
                margin: '0 0 0.5rem 0',
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              Active Participants
            </h4>
            {participants.map((participant) => {
              const isMe = participant.identity === room.localParticipant.identity;
              const isRemote = participant !== room.localParticipant;

              return (
                <div
                  key={participant.identity}
                  style={{
                    padding: '0.5rem',
                    marginBottom: '0.5rem',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '0.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {participant.name || participant.identity}
                      {isMe && (
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                          {' '}
                          (You - Host)
                        </span>
                      )}
                    </div>
                  </div>
                  {isRemote && (
                    <button
                      onClick={() => handleKick(participant as RemoteParticipant)}
                      className="lk-button"
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        background: 'var(--vcyber-danger-bg)',
                        border: '1px solid var(--vcyber-danger-border)',
                      }}
                    >
                      Kick
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style jsx global>{`
        @media (max-width: 768px) {
          .participant-manage-btn {
            right: 0.5rem !important;
            top: 0.5rem !important;
            padding: 0.4rem 0.6rem !important;
            font-size: 0.75rem !important;
          }

          .participant-manage-panel {
            width: calc(100vw - 1rem) !important;
            right: 0.5rem !important;
            top: 3rem !important;
            max-height: 70vh !important;
          }
        }
      `}</style>
    </>
  );
}
