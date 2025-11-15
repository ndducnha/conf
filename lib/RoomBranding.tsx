'use client';

import React from 'react';

export function RoomBranding() {
  return (
    <div
      style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        zIndex: 10,
        background: 'rgba(0, 0, 0, 0.6)',
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        backdropFilter: 'blur(10px)',
      }}
    >
      <img
        src="/images/logo.jpg"
        alt="Vcyber"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '4px',
        }}
      />
      <span
        style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: 'white',
          letterSpacing: '0.5px',
        }}
      >
        Vcyber
      </span>
    </div>
  );
}
