'use client';

import React from 'react';
import { useChat, useRoomContext, useDataChannel } from '@livekit/components-react';
import toast from 'react-hot-toast';

export function EnhancedChat() {
  const { send, chatMessages } = useChat();
  const room = useRoomContext();
  const [message, setMessage] = React.useState('');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Handle incoming files via data channel
  React.useEffect(() => {
    const handleData = async (
      payload: Uint8Array,
      participant?: any,
      kind?: any,
      topic?: string
    ) => {
      if (topic === 'file-transfer') {
        try {
          const decoder = new TextDecoder();
          const fileData = JSON.parse(decoder.decode(payload));

          // Create download link
          const byteCharacters = atob(fileData.content);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: fileData.type });

          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileData.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          toast.success(`File received: ${fileData.name}`);
        } catch (error) {
          console.error('Error receiving file:', error);
          toast.error('Failed to receive file');
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
    if (!selectedFile || selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];

        const fileData = {
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size,
          content: base64,
        };

        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(fileData));

        await room.localParticipant.publishData(data, {
          reliable: true,
          topic: 'file-transfer',
        });

        await send(`📎 Sent file: ${selectedFile.name}`);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setMessage(`📎 ${file.name}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {chatMessages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>
              {msg.from?.identity || 'Unknown'}
            </div>
            <div style={{ color: 'white' }}>
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        {selectedFile && (
          <div style={{
            marginBottom: '0.5rem',
            padding: '0.5rem',
            background: 'rgba(0,102,255,0.1)',
            borderRadius: '0.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
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
