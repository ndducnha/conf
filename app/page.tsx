'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useState } from 'react';
import { encodePassphrase, generateRoomId, randomString } from '@/lib/client-utils';
import styles from '../styles/Home.module.css';

function SimpleMeetingPage() {
  const router = useRouter();
  const startMeeting = () => {
    router.push(`/rooms/${generateRoomId()}`);
  };
  return (
    <div className={styles.tabContent}>
      <button className="lk-button" onClick={startMeeting}>
        Create Meeting Room
      </button>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <main className={styles.main} data-lk-theme="default">
        <div className="header">
          <img src="/images/logo.jpg" alt="Vcyber" width="200" height="200" />
          <h2>Vcyber</h2>
        </div>
        <SimpleMeetingPage />
      </main>
    </>
  );
}
