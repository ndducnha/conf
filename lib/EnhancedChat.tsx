'use client';

import React from 'react';
import { useChat, useRoomContext, useDataChannel } from '@livekit/components-react';
import toast from 'react-hot-toast';

interface FileMessage {
  id: string;
  name: string;
  size: number;
  from: string;
  blob: Blob;
}

interface EnhancedChatProps {
  onNewMessage?: () => void;
}

// Hook to detect window focus
function useWindowFocus() {
  const [isFocused, setIsFocused] = React.useState(true);

  React.useEffect(() => {
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Check initial state
    setIsFocused(document.hasFocus());

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return isFocused;
}

export function EnhancedChat({ onNewMessage }: EnhancedChatProps = {}) {
  const { send, chatMessages } = useChat();
  const room = useRoomContext();
  const [message, setMessage] = React.useState('');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [receivedFiles, setReceivedFiles] = React.useState<FileMessage[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Window focus detection
  const isWindowFocused = useWindowFocus();

  // Rate limiting: track last notification time per sender
  const lastNotificationTimeRef = React.useRef<Map<string, number>>(new Map());
  const NOTIFICATION_THROTTLE_MS = 3000; // 3 seconds between notifications from same sender

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Track previous message count for notifications
  const prevMessageCountRef = React.useRef(chatMessages.length);

  React.useEffect(() => {
    scrollToBottom();

    // Show notification for new chat messages (skip initial load and own messages)
    if (chatMessages.length > prevMessageCountRef.current && prevMessageCountRef.current > 0) {
      const newMessage = chatMessages[chatMessages.length - 1];
      const isOwnMessage = newMessage.from?.identity === room.localParticipant.identity;
      const isFileMessage =
        newMessage.message?.includes('📎') || newMessage.message?.includes('Sent file');

      // Only notify for other people's text messages
      if (!isOwnMessage && !isFileMessage) {
        const senderIdentity = newMessage.from?.identity || 'Unknown';
        const now = Date.now();
        const lastNotificationTime = lastNotificationTimeRef.current.get(senderIdentity) || 0;
        const timeSinceLastNotification = now - lastNotificationTime;

        // Check rate limiting AND window focus
        const shouldNotify =
          timeSinceLastNotification >= NOTIFICATION_THROTTLE_MS && !isWindowFocused;

        if (shouldNotify) {
          // Update last notification time
          lastNotificationTimeRef.current.set(senderIdentity, now);

          // Trigger the notification badge
          onNewMessage?.();

          setTimeout(() => {
            toast(
              `💬 ${newMessage.from?.name || newMessage.from?.identity || 'Someone'}: ${newMessage.message}`,
              {
                duration: 4000,
                position: 'top-right',
              },
            );
          }, 100);
        }
      }
    }
    prevMessageCountRef.current = chatMessages.length;
  }, [chatMessages, receivedFiles, room.localParticipant, onNewMessage, isWindowFocused]);

  // Handle incoming files via data channel (with chunking support)
  const [fileChunks, setFileChunks] = React.useState<
    Map<string, { metadata: any; chunks: string[] }>
  >(new Map());
  const [pendingFileNotification, setPendingFileNotification] = React.useState<string | null>(null);

  // Show file notification separately to avoid setState during render
  React.useEffect(() => {
    if (pendingFileNotification) {
      toast.success(`File received: ${pendingFileNotification}`);
      setPendingFileNotification(null);
    }
  }, [pendingFileNotification]);

  React.useEffect(() => {
    const handleData = async (
      payload: Uint8Array,
      participant?: any,
      kind?: any,
      topic?: string,
    ) => {
      if (topic === 'file-transfer') {
        try {
          const decoder = new TextDecoder();
          const data = JSON.parse(decoder.decode(payload));

          if (data.type === 'file-metadata') {
            // Initialize file reception
            setFileChunks((prev) => {
              const newMap = new Map(prev);
              newMap.set(data.fileId, {
                metadata: data,
                chunks: new Array(data.totalChunks).fill(null),
              });
              return newMap;
            });
          } else if (data.type === 'file-chunk') {
            // Receive chunk
            setFileChunks((prev) => {
              const newMap = new Map(prev);
              const fileData = newMap.get(data.fileId);

              if (fileData) {
                fileData.chunks[data.chunkIndex] = data.data;

                // Check if all chunks received
                if (fileData.chunks.every((chunk) => chunk !== null)) {
                  // Reconstruct file
                  const base64 = fileData.chunks.join('');
                  const byteCharacters = atob(base64);
                  const byteNumbers = new Array(byteCharacters.length);
                  for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                  }
                  const byteArray = new Uint8Array(byteNumbers);
                  const blob = new Blob([byteArray], { type: fileData.metadata.mimeType });

                  // Store file for download button
                  const fileMessage: FileMessage = {
                    id: data.fileId,
                    name: fileData.metadata.name,
                    size: fileData.metadata.size,
                    from: participant?.identity || 'Unknown',
                    blob,
                  };

                  setReceivedFiles((prev) => [...prev, fileMessage]);
                  setPendingFileNotification(fileData.metadata.name);

                  // Clean up
                  newMap.delete(data.fileId);
                }
              }

              return newMap;
            });
          }
        } catch (error) {
          console.error('Error receiving file:', error);
          // Delay error toast to avoid setState during render
          setTimeout(() => toast.error('Failed to receive file'), 0);
        }
      }
    };

    room.on('dataReceived', handleData);
    return () => {
      room.off('dataReceived', handleData);
    };
  }, [room]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFile) {
      await handleSendFile();
    } else if (message.trim()) {
      await send(message);
      setMessage('');
    }
  };

  const handleSendFile = async () => {
    if (!selectedFile || selectedFile.size > 15 * 1024 * 1024) {
      toast.error('File size must be less than 15MB');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];

        // Generate unique file ID
        const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const CHUNK_SIZE = 50000; // 50KB chunks to stay well under 64KB limit
        const totalChunks = Math.ceil(base64.length / CHUNK_SIZE);

        // Send file metadata first (with shortened name)
        const shortName = shortenFileName(selectedFile.name);
        const metadata = {
          type: 'file-metadata',
          fileId,
          name: shortName,
          mimeType: selectedFile.type,
          size: selectedFile.size,
          totalChunks,
        };

        const encoder = new TextEncoder();
        await room.localParticipant.publishData(encoder.encode(JSON.stringify(metadata)), {
          reliable: true,
          topic: 'file-transfer',
        });

        // Send file in chunks
        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, base64.length);
          const chunk = base64.substring(start, end);

          const chunkData = {
            type: 'file-chunk',
            fileId,
            chunkIndex: i,
            totalChunks,
            data: chunk,
          };

          await room.localParticipant.publishData(encoder.encode(JSON.stringify(chunkData)), {
            reliable: true,
            topic: 'file-transfer',
          });

          // Small delay between chunks to avoid overwhelming the connection
          await new Promise((resolve) => setTimeout(resolve, 10));
        }

        await send(`📎 Sent file: ${shortName}`);

        setSelectedFile(null);
        setMessage('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        toast.success('File sent successfully');
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Error sending file:', error);
      toast.error('Failed to send file');
    }
  };

  // Helper function to shorten file name to 10 characters
  const shortenFileName = (fileName: string): string => {
    const lastDotIndex = fileName.lastIndexOf('.');
    const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
    const nameWithoutExt = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;

    if (nameWithoutExt.length <= 10) {
      return fileName;
    }

    return nameWithoutExt.substring(0, 10) + extension;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error('File size must be less than 15MB');
        return;
      }
      setSelectedFile(file);
      const shortName = shortenFileName(file.name);
      setMessage(`📎 ${shortName}`);
    }
  };

  const handleDownloadFile = (file: FileMessage) => {
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded: ${file.name}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {chatMessages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: '0.75rem' }}>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '0.25rem',
              }}
            >
              {msg.from?.identity || 'Unknown'}
            </div>
            <div style={{ color: 'white' }}>{msg.message}</div>
          </div>
        ))}

        {receivedFiles.map((file) => (
          <div
            key={file.id}
            style={{
              marginBottom: '0.75rem',
              padding: '0.75rem',
              background: 'var(--vcyber-blue-bg)',
              borderRadius: '0.5rem',
              border: '1px solid var(--vcyber-blue-border)',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '0.5rem',
              }}
            >
              {file.from}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 500 }}>📎 {file.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                  {(file.size / 1024).toFixed(2)} KB
                </div>
              </div>
              <button
                onClick={() => handleDownloadFile(file)}
                className="lk-button"
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  background: 'var(--vcyber-success-bg)',
                  border: '1px solid var(--vcyber-success-border)',
                }}
              >
                ⬇ Download
              </button>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}
      >
        {selectedFile && (
          <div
            style={{
              marginBottom: '0.5rem',
              padding: '0.5rem',
              background: 'var(--vcyber-blue-bg)',
              borderRadius: '0.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.875rem' }}>
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setMessage('');
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={message}
            onChange={(e) => !selectedFile && setMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={!!selectedFile}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '0.25rem',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(0,0,0,0.3)',
              color: 'white',
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="lk-button"
            style={{ padding: '0.5rem 1rem' }}
            title="Attach file"
          >
            📎
          </button>
          <button type="submit" className="lk-button" style={{ padding: '0.5rem 1rem' }}>
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
