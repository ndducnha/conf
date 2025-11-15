'use client';

import React from 'react';
import { decodePassphrase } from '@/lib/client-utils';
import { DebugMode } from '@/lib/Debug';
import { KeyboardShortcuts } from '@/lib/KeyboardShortcuts';
import { RecordingIndicator } from '@/lib/RecordingIndicator';
import { SettingsMenu } from '@/lib/SettingsMenu';
import { RoomBranding } from '@/lib/RoomBranding';
import { RecordingControls } from '@/lib/RecordingControls';
import { EnhancedChat } from '@/lib/EnhancedChat';
import { UnifiedMenu } from '@/lib/UnifiedMenu';
import { ConnectionDetails } from '@/lib/types';
import {
  formatChatMessageLinks,
  LocalUserChoices,
  PreJoin,
  RoomContext,
  VideoConference,
  useTracks,
  GridLayout,
  ParticipantTile,
  ControlBar,
  RoomAudioRenderer,
  ConnectionStateToast,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import {
  ExternalE2EEKeyProvider,
  RoomOptions,
  VideoCodec,
  VideoPresets,
  Room,
  DeviceUnsupportedError,
  RoomConnectOptions,
  RoomEvent,
  TrackPublishDefaults,
  VideoCaptureOptions,
} from 'livekit-client';
import { useRouter } from 'next/navigation';
import { useSetupE2EE } from '@/lib/useSetupE2EE';
import { useLowCPUOptimizer } from '@/lib/usePerfomanceOptimiser';

const CONN_DETAILS_ENDPOINT =
  process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details';
const SHOW_SETTINGS_MENU = process.env.NEXT_PUBLIC_SHOW_SETTINGS_MENU == 'true';

export function PageClientImpl(props: {
  roomName: string;
  region?: string;
  hq: boolean;
  codec: VideoCodec;
}) {
  const [preJoinChoices, setPreJoinChoices] = React.useState<LocalUserChoices | undefined>(
    undefined,
  );
  const preJoinDefaults = React.useMemo(() => {
    return {
      username: '',
      videoEnabled: true,
      audioEnabled: true,
    };
  }, []);
  const [connectionDetails, setConnectionDetails] = React.useState<ConnectionDetails | undefined>(
    undefined,
  );

  const handlePreJoinSubmit = React.useCallback(async (values: LocalUserChoices) => {
    setPreJoinChoices(values);
    const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
    url.searchParams.append('roomName', props.roomName);
    url.searchParams.append('participantName', values.username);
    if (props.region) {
      url.searchParams.append('region', props.region);
    }
    const connectionDetailsResp = await fetch(url.toString());
    const connectionDetailsData = await connectionDetailsResp.json();
    setConnectionDetails(connectionDetailsData);
  }, []);
  const handlePreJoinError = React.useCallback((e: any) => console.error(e), []);

  return (
    <main data-lk-theme="default" style={{ height: '100%' }}>
      {connectionDetails === undefined || preJoinChoices === undefined ? (
        <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img
              src="/images/logo.jpg"
              alt="Vcyber"
              width="120"
              height="120"
              style={{ borderRadius: '12px', marginBottom: '1rem' }}
            />
            <h2 style={{ margin: 0, color: 'white' }}>Vcyber</h2>
          </div>
          <PreJoin
            defaults={preJoinDefaults}
            onSubmit={handlePreJoinSubmit}
            onError={handlePreJoinError}
          />
        </div>
      ) : (
        <VideoConferenceComponent
          connectionDetails={connectionDetails}
          userChoices={preJoinChoices}
          options={{ codec: props.codec, hq: props.hq }}
        />
      )}
    </main>
  );
}

function VideoConferenceComponent(props: {
  userChoices: LocalUserChoices;
  connectionDetails: ConnectionDetails;
  options: {
    hq: boolean;
    codec: VideoCodec;
  };
}) {
  const keyProvider = new ExternalE2EEKeyProvider();
  const { worker, e2eePassphrase } = useSetupE2EE();
  const e2eeEnabled = !!(e2eePassphrase && worker);

  const [e2eeSetupComplete, setE2eeSetupComplete] = React.useState(false);
  const [waitingForApproval, setWaitingForApproval] = React.useState(false);
  const [isDenied, setIsDenied] = React.useState(false);

  const roomOptions = React.useMemo((): RoomOptions => {
    let videoCodec: VideoCodec | undefined = props.options.codec ? props.options.codec : 'vp9';
    if (e2eeEnabled && (videoCodec === 'av1' || videoCodec === 'vp9')) {
      videoCodec = undefined;
    }
    const videoCaptureDefaults: VideoCaptureOptions = {
      deviceId: props.userChoices.videoDeviceId ?? undefined,
      resolution: props.options.hq ? VideoPresets.h2160 : VideoPresets.h720,
    };
    const publishDefaults: TrackPublishDefaults = {
      dtx: false,
      videoSimulcastLayers: props.options.hq
        ? [VideoPresets.h1080, VideoPresets.h720]
        : [VideoPresets.h540, VideoPresets.h216],
      red: !e2eeEnabled,
      videoCodec,
    };
    return {
      videoCaptureDefaults: videoCaptureDefaults,
      publishDefaults: publishDefaults,
      audioCaptureDefaults: {
        deviceId: props.userChoices.audioDeviceId ?? undefined,
      },
      adaptiveStream: true,
      dynacast: true,
      e2ee: keyProvider && worker && e2eeEnabled ? { keyProvider, worker } : undefined,
      singlePeerConnection: true,
    };
  }, [props.userChoices, props.options.hq, props.options.codec]);

  const room = React.useMemo(() => new Room(roomOptions), []);

  React.useEffect(() => {
    if (e2eeEnabled) {
      keyProvider
        .setKey(decodePassphrase(e2eePassphrase))
        .then(() => {
          room.setE2EEEnabled(true).catch((e) => {
            if (e instanceof DeviceUnsupportedError) {
              alert(
                `You're trying to join an encrypted meeting, but your browser does not support it. Please update it to the latest version and try again.`,
              );
              console.error(e);
            } else {
              throw e;
            }
          });
        })
        .then(() => setE2eeSetupComplete(true));
    } else {
      setE2eeSetupComplete(true);
    }
  }, [e2eeEnabled, room, e2eePassphrase]);

  const connectOptions = React.useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);

  React.useEffect(() => {
    room.on(RoomEvent.Disconnected, handleOnLeave);
    room.on(RoomEvent.EncryptionError, handleEncryptionError);
    room.on(RoomEvent.MediaDevicesError, handleError);

    // Handle data messages for kick and waiting room
    const handleDataReceived = async (
      payload: Uint8Array,
      participant?: any,
      kind?: any,
      topic?: string,
    ) => {
      try {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(payload));

        // Handle kick message
        if (topic === 'participant-control' && data.action === 'kick') {
          if (data.identity === room.localParticipant.identity) {
            alert('You have been removed from the meeting by the host');
            await room.disconnect();
            handleOnLeave();
          }
        }

        // Handle waiting room response
        if (topic === 'waiting-room-response') {
          if (data.identity === room.localParticipant.identity) {
            if (data.action === 'approved') {
              setWaitingForApproval(false);
            } else if (data.action === 'denied') {
              setIsDenied(true);
              alert('Your request to join was denied by the host');
              await room.disconnect();
              handleOnLeave();
            }
          }
        }
      } catch (error) {
        console.error('Error handling data:', error);
      }
    };

    room.on('dataReceived', handleDataReceived);

    if (e2eeSetupComplete) {
      room
        .connect(
          props.connectionDetails.serverUrl,
          props.connectionDetails.participantToken,
          connectOptions,
        )
        .then(async () => {
          // Send join request for waiting room (unless you're likely the first/host)
          // We'll send the request and let the host logic handle it
          const encoder = new TextEncoder();
          const joinRequest = encoder.encode(
            JSON.stringify({
              action: 'join-request',
              identity: room.localParticipant.identity,
              name: props.userChoices.username,
            }),
          );

          // Wait a moment to let other participants load, then send join request
          setTimeout(async () => {
            const participants = Array.from(room.remoteParticipants.values());
            // If there are other participants, we might need approval
            if (participants.length > 0) {
              setWaitingForApproval(true);
              await room.localParticipant.publishData(joinRequest, {
                reliable: true,
                topic: 'waiting-room-request',
              });
            }
          }, 1000);

          if (props.userChoices.videoEnabled) {
            await room.localParticipant.setCameraEnabled(true).catch((error) => {
              handleError(error);
            });
          }
          if (props.userChoices.audioEnabled) {
            await room.localParticipant.setMicrophoneEnabled(true).catch((error) => {
              handleError(error);
            });
          }
        })
        .catch((error) => {
          handleError(error);
        });
    }
    return () => {
      room.off(RoomEvent.Disconnected, handleOnLeave);
      room.off(RoomEvent.EncryptionError, handleEncryptionError);
      room.off(RoomEvent.MediaDevicesError, handleError);
      room.off('dataReceived', handleDataReceived);
    };
  }, [e2eeSetupComplete, room, props.connectionDetails, props.userChoices]);

  const lowPowerMode = useLowCPUOptimizer(room);

  const router = useRouter();
  const handleOnLeave = React.useCallback(() => router.push('/'), [router]);
  const handleError = React.useCallback((error: Error) => {
    console.error(error);
    alert(`Encountered an unexpected error, check the console logs for details: ${error.message}`);
  }, []);
  const handleEncryptionError = React.useCallback((error: Error) => {
    console.error(error);
    alert(
      `Encountered an unexpected encryption error, check the console logs for details: ${error.message}`,
    );
  }, []);

  React.useEffect(() => {
    if (lowPowerMode) {
      console.warn('Low power mode enabled');
    }
  }, [lowPowerMode]);

  return (
    <div className="lk-room-container" style={{ position: 'relative' }}>
      <RoomContext.Provider value={room}>
        {waitingForApproval ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <img
              src="/images/logo.jpg"
              alt="Vcyber"
              width="120"
              height="120"
              style={{ borderRadius: '12px', marginBottom: '1rem' }}
            />
            <h2 style={{ color: 'white' }}>Vcyber</h2>
            <div style={{ fontSize: '2rem' }}>⏳</div>
            <h3>Waiting for host approval...</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', maxWidth: '400px' }}>
              The host will approve or deny your request to join shortly.
            </p>
          </div>
        ) : (
          <>
            <RoomBranding />
            <KeyboardShortcuts />
            <CustomVideoConferenceLayout />
            <DebugMode />
            <RecordingIndicator />
          </>
        )}
      </RoomContext.Provider>
    </div>
  );
}

function CustomVideoConferenceLayout() {
  const [showChat, setShowChat] = React.useState(false);
  const [showRecording, setShowRecording] = React.useState(false);
  const [unreadMessages, setUnreadMessages] = React.useState(0);
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  const handleOpenChat = React.useCallback(() => {
    setShowChat(true);
    setUnreadMessages(0); // Clear unread count when opening chat
  }, []);

  const handleNewMessage = React.useCallback(() => {
    if (!showChat) {
      setUnreadMessages((prev) => prev + 1);
    }
  }, [showChat]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <GridLayout tracks={tracks}>
              <ParticipantTile />
            </GridLayout>
          </div>
          <div
            style={{
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
            }}
          >
            <div style={{ flex: 1 }}>
              <ControlBar variation="verbose" />
            </div>
            <UnifiedMenu
              onOpenChat={handleOpenChat}
              onOpenRecording={() => setShowRecording(true)}
              unreadMessages={unreadMessages}
            />
          </div>
        </div>

        {showChat && (
          <div
            className="chat-panel"
            style={{
              width: '350px',
              background: 'rgba(0, 0, 0, 0.9)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0 }}>Chat</h3>
              <button
                onClick={() => setShowChat(false)}
                className="lk-button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  padding: '0 0.5rem',
                }}
              >
                ×
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <EnhancedChat onNewMessage={handleNewMessage} />
            </div>
          </div>
        )}
      </div>

      {showRecording && <RecordingControls onClose={() => setShowRecording(false)} />}

      <RoomAudioRenderer />
      <ConnectionStateToast />

      {/* Responsive styles */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .chat-panel {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            z-index: 1000 !important;
          }
        }
      `}</style>
    </div>
  );
}
