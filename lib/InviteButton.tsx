'use client';

import React from 'react';
import toast from 'react-hot-toast';

export function InviteButton() {
  const copyRoomLink = () => {
    const roomUrl = window.location.href;
    navigator.clipboard.writeText(roomUrl).then(
      () => {
        toast.success('Room link copied to clipboard!');
      },
      (err) => {
        console.error('Failed to copy link:', err);
        toast.error('Failed to copy link');
      }
    );
  };

  return (
    <button
      onClick={copyRoomLink}
      className="lk-button"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        background: 'rgba(0, 102, 255, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '0.5rem',
        color: 'white',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: 500,
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
      Invite
    </button>
  );
}
