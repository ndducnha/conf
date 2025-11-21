'use client';

import React from 'react';
import { useParticipants, useRoomContext } from '@livekit/components-react';
import { RemoteParticipant } from 'livekit-client';
import toast from 'react-hot-toast';
import { usePinnedParticipant } from './PinnedParticipantContext';
import { stripParticipantPostfix } from './client-utils';

interface UnifiedMenuProps {
  onOpenChat: () => void;
  onOpenRecording: () => void;
  unreadMessages?: number;
}

export function UnifiedMenu({ onOpenChat, onOpenRecording, unreadMessages = 0 }: UnifiedMenuProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const [showParticipants, setShowParticipants] = React.useState(false);
  type WaitingParticipant = {
    identity: string;
    name?: string;
  };

  const [waitingParticipants, setWaitingParticipants] = React.useState<WaitingParticipant[]>([]);
  const participants = useParticipants();
  const room = useRoomContext();

  const isHost = React.useMemo(() => {
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
          setWaitingParticipants((prev) => {
            if (prev.some((participant) => participant.identity === data.identity)) {
              return prev;
            }

            return [...prev, { identity: data.identity, name: data.name }];
          });
          toast(`${data.name} wants to join`, { duration: 10000 });
        }
      }
    };

    room.on('dataReceived', handleData);
    return () => {
      room.off('dataReceived', handleData);
    };
  }, [room, isHost]);

  const copyRoomLink = () => {
    const roomUrl = window.location.href;
    navigator.clipboard.writeText(roomUrl).then(
      () => {
        toast.success('Room link copied to clipboard!');
        setShowMenu(false);
      },
      (err) => {
        console.error('Failed to copy link:', err);
        toast.error('Failed to copy link');
      },
    );
  };

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

    setWaitingParticipants((prev) => prev.filter((p) => p.identity !== identity));
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

    setWaitingParticipants((prev) => prev.filter((p) => p.identity !== identity));
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

      toast.success(`Kicked ${participant.name || stripParticipantPostfix(participant.identity)}`);
    } catch (error) {
      console.error('Error kicking participant:', error);
      toast.error('Failed to kick participant');
    }
  };

  const { pinnedIdentity, setPinnedIdentity } = (() => {
    try {
      return usePinnedParticipant();
    } catch (e) {
      return { pinnedIdentity: null, setPinnedIdentity: () => {} } as any;
    }
  })();

  const handlePin = async (identity: string) => {
    try {
      const alreadyPinned = pinnedIdentity === identity;
      // Local-only pin: do not broadcast to the room. Each participant's pin is local to them.
      setPinnedIdentity(alreadyPinned ? null : identity);
      toast.success(alreadyPinned ? 'Unpinned participant (local)' : 'Pinned participant (local)');
    } catch (error) {
      console.error('Error pinning participant:', error);
      toast.error('Failed to pin participant');
    }
  };

  return (
    <>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="lk-button unified-menu-btn"
        style={{
          padding: '0.5rem 1rem',
          background: 'rgba(100, 100, 100, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          position: 'relative',
        }}
      >
        ☰ Menu
        {unreadMessages > 0 && (
          <span
            className="new-chat-indicator"
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              width: '8px',
              height: '8px',
              background: 'var(--vcyber-cyan)',
              borderRadius: '50%',
              animation: 'pulse-chat 2s infinite',
              boxShadow: '0 0 8px var(--vcyber-cyan)',
            }}
          />
        )}
        {(waitingParticipants.length > 0 || unreadMessages > 0) && (
          <span
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              background: 'var(--vcyber-danger)',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold',
            }}
          >
            {waitingParticipants.length + unreadMessages}
          </span>
        )}
      </button>

      {isHost && waitingParticipants.length > 0 && (
        <div
          className="waiting-room-popover"
          style={{
            position: 'fixed',
            bottom: '6rem',
            right: '1rem',
            width: '280px',
            background: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            zIndex: 1100,
            boxShadow: '0 8px 16px rgba(0,0,0,0.35)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Waiting room</h4>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
              {waitingParticipants.length} pending
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto' }}>
            {waitingParticipants.map((participant) => (
              <div
                key={participant.identity}
                style={{
                  padding: '0.5rem',
                  background: 'var(--vcyber-warning-bg)',
                  border: '1px solid var(--vcyber-warning-border)',
                  borderRadius: '0.35rem',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                  {participant.name || stripParticipantPostfix(participant.identity)}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleApprove(participant.identity)}
                    className="lk-button"
                    style={{
                      flex: 1,
                      padding: '0.35rem 0.5rem',
                      fontSize: '0.8rem',
                      background: 'var(--vcyber-success-bg)',
                      border: '1px solid var(--vcyber-success-border)',
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleDeny(participant.identity)}
                    className="lk-button"
                    style={{
                      flex: 1,
                      padding: '0.35rem 0.5rem',
                      fontSize: '0.8rem',
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
        </div>
      )}

      {showMenu && (
        <div
          className="unified-menu-dropdown"
          style={{
            position: 'fixed',
            bottom: '5rem',
            right: '1rem',
            background: 'rgba(0, 0, 0, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '0.5rem',
            padding: '0.5rem',
            zIndex: 1000,
            minWidth: '200px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Menu</h3>
            <button
              onClick={() => setShowMenu(false)}
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

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              padding: '0.5rem 0',
            }}
          >
            <button
              onClick={() => {
                onOpenChat();
                setShowMenu(false);
              }}
              className="lk-button"
              style={{
                width: '100%',
                padding: '0.75rem',
                textAlign: 'left',
                background: 'var(--vcyber-blue-bg)',
                border: '1px solid var(--vcyber-blue-border)',
                position: 'relative',
              }}
            >
              💬 Chat
              {unreadMessages > 0 && (
                <span
                  className="new-chat-indicator"
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    width: '8px',
                    height: '8px',
                    background: 'var(--vcyber-cyan)',
                    borderRadius: '50%',
                    animation: 'pulse-chat 2s infinite',
                    boxShadow: '0 0 8px var(--vcyber-cyan)',
                  }}
                />
              )}
              {unreadMessages > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '0.75rem',
                    transform: 'translateY(-50%)',
                    background: 'var(--vcyber-danger)',
                    borderRadius: '50%',
                    minWidth: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    padding: '0 0.25rem',
                  }}
                >
                  {unreadMessages}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onOpenRecording();
                setShowMenu(false);
              }}
              className="lk-button"
              style={{
                width: '100%',
                padding: '0.75rem',
                textAlign: 'left',
                background: 'var(--vcyber-danger-bg)',
                border: '1px solid var(--vcyber-danger-border)',
              }}
            >
              🎥 Recording
            </button>

            <button
              onClick={copyRoomLink}
              className="lk-button"
              style={{
                width: '100%',
                padding: '0.75rem',
                textAlign: 'left',
                background: 'var(--vcyber-success-bg)',
                border: '1px solid var(--vcyber-success-border)',
              }}
            >
              🔗 Copy Invite Link
            </button>

            <button
              onClick={() => {
                setShowParticipants(!showParticipants);
              }}
              className="lk-button"
              style={{
                width: '100%',
                padding: '0.75rem',
                textAlign: 'left',
                background: 'var(--vcyber-purple-bg)',
                border: '1px solid var(--vcyber-purple-border)',
              }}
            >
              👥 Participants ({participants.length})
              {isHost && waitingParticipants.length > 0 && ` - ${waitingParticipants.length} waiting`}
            </button>
          </div>

          {showParticipants && (
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.1)',
                padding: '0.5rem',
                maxHeight: '300px',
                overflowY: 'auto',
              }}
            >
              {isHost && waitingParticipants.length > 0 && (
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
                  {waitingParticipants.map(({ identity, name }) => (
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
                      <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>{name || stripParticipantPostfix(identity)}</div>
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
                    <div style={{ fontSize: '0.875rem' }}>
                      {participant.name || stripParticipantPostfix(participant.identity)}
                      {isMe && (
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                          {' '}
                          (Host)
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {isRemote && (
                        <button
                          onClick={() => handlePin(participant.identity)}
                          className="lk-button"
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            background: pinnedIdentity === participant.identity ? 'var(--vcyber-success-bg)' : 'var(--vcyber-primary)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          {pinnedIdentity === participant.identity ? 'Unpin (local)' : 'Pin (local)'}
                        </button>
                      )}
                      {isHost && isRemote && (
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse-chat {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.3);
          }
        }

        @media (max-width: 768px) {
          .unified-menu-dropdown {
            right: 0.5rem !important;
            bottom: 4rem !important;
            width: calc(100vw - 1rem) !important;
            max-width: 350px;
          }
        }
      `}</style>
    </>
  );
}
