'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../styles/Home.module.css';

interface Recording {
  recordingId: string;
  roomName: string;
  startTime: string;
  endTime?: string;
  status: string;
  duration?: number;
  videoFile?: string;
  videoPath?: string;
}

export default function RecordingsPage() {
  const [recordings, setRecordings] = React.useState<Recording[]>([]);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      const response = await fetch('/api/recording/list');
      const data = await response.json();
      setRecordings(data.recordings || []);
    } catch (error) {
      console.error('Error fetching recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <main className={styles.main} data-lk-theme="default">
      <div className="header">
        <img src="/images/logo.jpg" alt="Vcyber" width="100" height="100" style={{ borderRadius: '8px' }} />
        <h2>Vcyber Recordings</h2>
      </div>

      <div style={{ width: '100%', maxWidth: '800px', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>All Recordings</h3>
          <button
            onClick={() => router.push('/')}
            className="lk-button"
            style={{ padding: '0.5rem 1rem' }}
          >
            ← Back to Home
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Loading recordings...</p>
          </div>
        ) : recordings.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(255,255,255,0.15)'
          }}>
            <p style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>🎥</p>
            <h3>No recordings yet</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>
              Start a meeting and use the recording feature to save your sessions
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recordings.map((recording) => (
              <div
                key={recording.recordingId}
                style={{
                  padding: '1.5rem',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
                      {recording.roomName}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                      {formatDate(recording.startTime)}
                    </p>
                  </div>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      background: recording.status === 'completed' ? 'rgba(0,255,0,0.2)' : 'rgba(255,165,0,0.2)',
                      border: `1px solid ${recording.status === 'completed' ? 'rgba(0,255,0,0.4)' : 'rgba(255,165,0,0.4)'}`,
                    }}
                  >
                    {recording.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Recording ID:</span>
                    <br />
                    <code style={{ fontSize: '0.75rem' }}>{recording.recordingId}</code>
                  </div>
                  {recording.duration && (
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>Duration:</span>
                      <br />
                      {formatDuration(recording.duration)}
                    </div>
                  )}
                </div>

                {recording.videoPath && recording.status === 'completed' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <a
                      href={recording.videoPath}
                      download={recording.videoFile}
                      className="lk-button"
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        background: 'rgba(0,255,0,0.3)',
                        border: '1px solid rgba(0,255,0,0.5)',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      ⬇ Download Video
                    </a>
                    <a
                      href={recording.videoPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="lk-button"
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        background: 'rgba(0,102,255,0.3)',
                        border: '1px solid rgba(0,102,255,0.5)',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      ▶ Play
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
