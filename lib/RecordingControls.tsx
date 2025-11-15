'use client';

import React from 'react';
import { useRoomContext } from '@livekit/components-react';
import { Track } from 'livekit-client';
import toast from 'react-hot-toast';

// Updated recording controls component

type RecordingState = 'idle' | 'recording' | 'paused';

interface RecordingControlsProps {
  onClose: () => void;
}

export function RecordingControls({ onClose }: RecordingControlsProps) {
  const room = useRoomContext();
  const [recordingState, setRecordingState] = React.useState<RecordingState>('idle');
  const [recordingId, setRecordingId] = React.useState<string | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const recordedChunksRef = React.useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      // Reset recorded chunks
      recordedChunksRef.current = [];

      // Get the canvas element that LiveKit uses for rendering
      // This will record the entire meeting view
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      let stream: MediaStream;

      if (canvas) {
        // Capture the canvas stream (the video grid)
        const canvasStream = canvas.captureStream(30); // 30 FPS

        // Get audio tracks from the room
        const audioTracks: MediaStreamTrack[] = [];
        room.remoteParticipants.forEach((participant) => {
          participant.audioTrackPublications.forEach((publication) => {
            if (publication.track) {
              audioTracks.push(publication.track.mediaStreamTrack);
            }
          });
        });

        // Add local audio if enabled
        if (room.localParticipant.isMicrophoneEnabled) {
          const localAudioTrack = room.localParticipant.getTrackPublication(
            Track.Source.Microphone,
          );
          if (localAudioTrack?.track) {
            audioTracks.push(localAudioTrack.track.mediaStreamTrack);
          }
        }

        // Combine video from canvas and audio from participants
        stream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);
      } else {
        // Fallback: ask for screen share if canvas not found
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
      }

      // Create MediaRecorder
      const options = { mimeType: 'video/webm;codecs=vp8,opus' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second

      // Create recording metadata
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
        const notification = encoder.encode(
          JSON.stringify({
            action: 'recording-started',
            recordingId: data.recordingId,
          }),
        );

        await room.localParticipant.publishData(notification, {
          reliable: true,
          topic: 'recording-status',
        });
      } else {
        mediaRecorder.stop();
        stream.getTracks().forEach((track) => track.stop());
        toast.error(data.error || 'Failed to start recording');
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recordingId || !mediaRecorderRef.current) return;

    try {
      const mediaRecorder = mediaRecorderRef.current;

      // Stop recording and wait for final data
      await new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => resolve();
        mediaRecorder.stop();
      });

      // Stop all tracks
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());

      // Create blob from recorded chunks
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });

      // Upload the video file
      const formData = new FormData();
      formData.append('video', blob, `${recordingId}.webm`);
      formData.append('recordingId', recordingId);
      formData.append('roomName', room.name);

      const uploadResponse = await fetch('/api/recording/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload recording');
      }

      // Update metadata
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
        recordedChunksRef.current = [];
        toast.success('Recording stopped and saved');

        // Notify all participants
        const encoder = new TextEncoder();
        const notification = encoder.encode(
          JSON.stringify({
            action: 'recording-stopped',
            recordingId,
          }),
        );

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
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.pause();
    setRecordingState('paused');
    toast.success('Recording paused');

    const encoder = new TextEncoder();
    const notification = encoder.encode(
      JSON.stringify({
        action: 'recording-paused',
        recordingId,
      }),
    );

    await room.localParticipant.publishData(notification, {
      reliable: true,
      topic: 'recording-status',
    });
  };

  const resumeRecording = async () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.resume();
    setRecordingState('recording');
    toast.success('Recording resumed');

    const encoder = new TextEncoder();
    const notification = encoder.encode(
      JSON.stringify({
        action: 'recording-resumed',
        recordingId,
      }),
    );

    await room.localParticipant.publishData(notification, {
      reliable: true,
      topic: 'recording-status',
    });
  };

  return (
    <div
      className="recording-modal"
      style={{
        position: 'fixed',
        bottom: '5rem',
        right: '1rem',
        background: 'rgba(0, 0, 0, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '0.5rem',
        padding: '1rem',
        zIndex: 1000,
        minWidth: '250px',
      }}
    >
      <div
        style={{
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1rem' }}>
          Recording
          {recordingState === 'recording' && (
            <span
              style={{
                marginLeft: '0.5rem',
                width: '8px',
                height: '8px',
                background: 'var(--vcyber-danger)',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'pulse 1.5s infinite',
              }}
            ></span>
          )}
        </h3>
        <button
          onClick={onClose}
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

      {recordingState === 'idle' && (
        <button
          onClick={startRecording}
          className="lk-button"
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'var(--vcyber-danger-bg)',
            border: '1px solid var(--vcyber-danger-border)',
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
            style={{
              width: '100%',
              padding: '0.5rem',
              background: 'var(--vcyber-warning-bg)',
              border: '1px solid var(--vcyber-warning-border)',
            }}
          >
            ⏸ Pause
          </button>
          <button
            onClick={stopRecording}
            className="lk-button"
            style={{
              width: '100%',
              padding: '0.5rem',
              background: 'var(--vcyber-danger-bg)',
              border: '1px solid var(--vcyber-danger-border)',
            }}
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
            style={{
              width: '100%',
              padding: '0.5rem',
              background: 'var(--vcyber-success-bg)',
              border: '1px solid var(--vcyber-success-border)',
            }}
          >
            ▶ Resume
          </button>
          <button
            onClick={stopRecording}
            className="lk-button"
            style={{
              width: '100%',
              padding: '0.5rem',
              background: 'var(--vcyber-danger-bg)',
              border: '1px solid var(--vcyber-danger-border)',
            }}
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 768px) {
          .recording-modal {
            right: 0.5rem !important;
            bottom: 4rem !important;
            width: calc(100vw - 1rem) !important;
            max-width: 300px;
          }
        }
      `}</style>
    </div>
  );
}
