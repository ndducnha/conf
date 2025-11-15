'use client';

import React from 'react';
import { useRoomContext } from '@livekit/components-react';
import toast from 'react-hot-toast';

type RecordingState = 'idle' | 'recording' | 'paused';

export function RecordingControls() {
  const room = useRoomContext();
  const [recordingState, setRecordingState] = React.useState<RecordingState>('idle');
  const [recordingId, setRecordingId] = React.useState<string | null>(null);
  const [showControls, setShowControls] = React.useState(false);

  const startRecording = async () => {
    try {
      const response = await fetch('/api/recording/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: room.name,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRecordingState('recording');
        setRecordingId(data.recordingId);
        toast.success('Recording started');

        // Notify all participants
        const encoder = new TextEncoder();
        const notification = encoder.encode(JSON.stringify({
          action: 'recording-started',
          recordingId: data.recordingId,
        }));

        await room.localParticipant.publishData(notification, {
          reliable: true,
          topic: 'recording-status',
        });
      } else {
        toast.error(data.error || 'Failed to start recording');
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recordingId) return;

    try {
      const response = await fetch('/api/recording/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordingId,
          roomName: room.name,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRecordingState('idle');
        setRecordingId(null);
        toast.success('Recording stopped and saved');

        // Notify all participants
        const encoder = new TextEncoder();
        const notification = encoder.encode(JSON.stringify({
          action: 'recording-stopped',
          recordingId,
        }));

        await room.localParticipant.publishData(notification, {
          reliable: true,
          topic: 'recording-status',
        });
      } else {
        toast.error(data.error || 'Failed to stop recording');
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast.error('Failed to stop recording');
    }
  };

  const pauseRecording = async () => {
    setRecordingState('paused');
    toast.success('Recording paused');

    const encoder = new TextEncoder();
    const notification = encoder.encode(JSON.stringify({
      action: 'recording-paused',
      recordingId,
    }));

    await room.localParticipant.publishData(notification, {
      reliable: true,
      topic: 'recording-status',
    });
  };

  const resumeRecording = async () => {
    setRecordingState('recording');
    toast.success('Recording resumed');

    const encoder = new TextEncoder();
    const notification = encoder.encode(JSON.stringify({
      action: 'recording-resumed',
      recordingId,
    }));

    await room.localParticipant.publishData(notification, {
      reliable: true,
      topic: 'recording-status',
    });
  };

  return (
    <>
      <button
        onClick={() => setShowControls(!showControls)}
        className="lk-button"
        style={{
          position: 'absolute',
          bottom: '5rem',
          right: '1rem',
          zIndex: 10,
          padding: '0.5rem 1rem',
          background: recordingState === 'recording' ? 'rgba(255,0,0,0.8)' : 'rgba(100,100,100,0.8)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        {recordingState === 'recording' && (
          <span style={{ width: '8px', height: '8px', background: 'red', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>
        )}
        🎥 Record
      </button>

      {showControls && (
        <div
          style={{
            position: 'absolute',
            bottom: '9rem',
            right: '1rem',
            background: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '0.5rem',
            padding: '1rem',
            zIndex: 100,
            minWidth: '200px',
          }}
        >
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Recording</h3>
            <button
              onClick={() => setShowControls(false)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}
            >
              ×
            </button>
          </div>

          {recordingState === 'idle' && (
            <button
              onClick={startRecording}
              className="lk-button"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,0,0,0.6)',
                border: '1px solid rgba(255,0,0,0.8)',
              }}
            >
              ● Start Recording
            </button>
          )}

          {recordingState === 'recording' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={pauseRecording}
                className="lk-button"
                style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,165,0,0.6)' }}
              >
                ⏸ Pause
              </button>
              <button
                onClick={stopRecording}
                className="lk-button"
                style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,0,0,0.6)' }}
              >
                ■ Stop & Save
              </button>
            </div>
          )}

          {recordingState === 'paused' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={resumeRecording}
                className="lk-button"
                style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,255,0,0.6)' }}
              >
                ▶ Resume
              </button>
              <button
                onClick={stopRecording}
                className="lk-button"
                style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,0,0,0.6)' }}
              >
                ■ Stop & Save
              </button>
            </div>
          )}

          {recordingState !== 'idle' && (
            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
              Status: {recordingState === 'recording' ? 'Recording...' : 'Paused'}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
}
