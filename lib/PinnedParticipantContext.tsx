'use client';

import React from 'react';

interface PinnedContextValue {
  pinnedIdentity: string | null;
  setPinnedIdentity: (id: string | null) => void;
}

export const PinnedParticipantContext = React.createContext<PinnedContextValue | undefined>(
  undefined,
);

export function usePinnedParticipant() {
  const ctx = React.useContext(PinnedParticipantContext);
  if (!ctx) throw new Error('usePinnedParticipant must be used within PinnedParticipantProvider');
  return ctx;
}
