# Phase 3: Chat Notification Enhancements

**Duration:** 4-6 hours
**Risk Level:** Medium (notification logic changes)
**Dependencies:** None (independent from Phase 1-2)
**Files Modified:** `lib/EnhancedChat.tsx`, `public/notification.mp3` (new)

---

## Objective

Implement window focus detection, rate limiting, audio notifications, and user preferences to eliminate notification fatigue and improve UX.

---

## Implementation Steps

### Step 1: Window Focus Detection Hook (30 min)

**File:** `lib/EnhancedChat.tsx`
**Location:** After imports, before component definition

**Add Hook:**

```typescript
// Custom hook for window focus detection
const useWindowFocus = () => {
  const [isFocused, setIsFocused] = React.useState(() => {
    // SSR-safe initialization
    if (typeof document !== 'undefined') {
      return document.hasFocus();
    }
    return true;
  });

  React.useEffect(() => {
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return isFocused;
};
```

**Usage in Component:**

```typescript
export function EnhancedChat({ onNewMessage }: EnhancedChatProps = {}) {
  const { send, chatMessages } = useChat();
  const room = useRoomContext();
  const isWindowFocused = useWindowFocus(); // ADD THIS
  // ... rest of state declarations
```

**Rationale:** Hook pattern reusable, encapsulates focus logic, SSR-safe for Next.js.

---

### Step 2: Update Notification Condition (15 min)

**File:** `lib/EnhancedChat.tsx`
**Current (lines 39-55):**

```typescript
if (chatMessages.length > prevMessageCountRef.current && prevMessageCountRef.current > 0) {
  const newMessage = chatMessages[chatMessages.length - 1];
  const isOwnMessage = newMessage.from?.identity === room.localParticipant.identity;
  const isFileMessage =
    newMessage.message?.includes('📎') || newMessage.message?.includes('Sent file');

  // Only notify for other people's text messages
  if (!isOwnMessage && !isFileMessage) {
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
```

**Updated:**

```typescript
if (
  chatMessages.length > prevMessageCountRef.current &&
  prevMessageCountRef.current > 0 &&
  !isWindowFocused
) {
  // ADD THIS CONDITION
  const newMessage = chatMessages[chatMessages.length - 1];
  const isOwnMessage = newMessage.from?.identity === room.localParticipant.identity;
  const isFileMessage =
    newMessage.message?.includes('📎') || newMessage.message?.includes('Sent file');

  // Only notify for other people's text messages when window not focused
  if (!isOwnMessage && !isFileMessage) {
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
```

**Impact:** Notifications only show when user is NOT viewing the tab (fixes Issue #1 from research).

---

### Step 3: Add Rate Limiting State (45 min)

**File:** `lib/EnhancedChat.tsx`
**Location:** After existing state declarations (after line 26)

**Add State:**

```typescript
const [lastNotificationTime, setLastNotificationTime] = React.useState<Record<string, number>>({});
const NOTIFICATION_THROTTLE_MS = 3000; // 3-second minimum between notifications per sender
```

**Update Notification Logic:**

```typescript
if (
  chatMessages.length > prevMessageCountRef.current &&
  prevMessageCountRef.current > 0 &&
  !isWindowFocused
) {
  const newMessage = chatMessages[chatMessages.length - 1];
  const isOwnMessage = newMessage.from?.identity === room.localParticipant.identity;
  const isFileMessage =
    newMessage.message?.includes('📎') || newMessage.message?.includes('Sent file');
  const senderId = newMessage.from?.identity || 'unknown';

  // Only notify for other people's text messages when window not focused
  if (!isOwnMessage && !isFileMessage) {
    // Rate limiting check
    const now = Date.now();
    const senderLastNotif = lastNotificationTime[senderId] || 0;

    if (now - senderLastNotif > NOTIFICATION_THROTTLE_MS) {
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

      // Update last notification time for this sender
      setLastNotificationTime((prev) => ({
        ...prev,
        [senderId]: now,
      }));
    }
  }
}
```

**Impact:** Max 1 notification per sender every 3 seconds, prevents spam (fixes Issue #2 from research).

---

### Step 4: Audio Notification Hook (60 min)

**File:** `lib/EnhancedChat.tsx`
**Location:** After `useWindowFocus` hook definition

**Add Hook:**

```typescript
// Custom hook for notification audio
const useNotificationAudio = () => {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [audioEnabled, setAudioEnabled] = React.useState(true);

  React.useEffect(() => {
    // Create audio element (SSR-safe)
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/notification.mp3');
      audioRef.current.volume = 0.5; // 50% volume
    }
  }, []);

  const playNotificationSound = React.useCallback(() => {
    if (audioRef.current && audioEnabled) {
      audioRef.current.currentTime = 0; // Reset to start
      audioRef.current.play().catch((err) => {
        // Browser autoplay policy blocked audio
        console.debug('Audio notification blocked (user gesture required):', err);
      });
    }
  }, [audioEnabled]);

  return { playNotificationSound, audioEnabled, setAudioEnabled };
};
```

**Usage in Component:**

```typescript
export function EnhancedChat({ onNewMessage }: EnhancedChatProps = {}) {
  const { send, chatMessages } = useChat();
  const room = useRoomContext();
  const isWindowFocused = useWindowFocus();
  const { playNotificationSound, audioEnabled, setAudioEnabled } = useNotificationAudio(); // ADD THIS
  // ... rest of state declarations
```

**Update Notification Logic:**

```typescript
if (now - senderLastNotif > NOTIFICATION_THROTTLE_MS) {
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

    // Play audio notification
    playNotificationSound(); // ADD THIS
  }, 100);

  // Update last notification time for this sender
  setLastNotificationTime((prev) => ({
    ...prev,
    [senderId]: now,
  }));
}
```

**Impact:** Audio alert plays with toast notification (fixes Issue #3 from research).

---

### Step 5: Notification Preferences UI (90 min)

**File:** `lib/EnhancedChat.tsx`
**Location:** After existing state declarations

**Add State:**

```typescript
interface NotificationPrefs {
  enabled: boolean;
  soundEnabled: boolean;
  throttleMs: number;
}

const [notificationPrefs, setNotificationPrefs] = React.useState<NotificationPrefs>(() => {
  // Load from localStorage (SSR-safe)
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('vcyber-notification-prefs');
    if (saved) {
      return JSON.parse(saved);
    }
  }
  return {
    enabled: true,
    soundEnabled: true,
    throttleMs: 3000,
  };
});

const [showSettings, setShowSettings] = React.useState(false);

// Persist preferences to localStorage
React.useEffect(() => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vcyber-notification-prefs', JSON.stringify(notificationPrefs));
  }
}, [notificationPrefs]);
```

**Update Hook Initialization:**

```typescript
const { playNotificationSound, audioEnabled, setAudioEnabled } = useNotificationAudio();

// Sync audio setting with preferences
React.useEffect(() => {
  setAudioEnabled(notificationPrefs.soundEnabled);
}, [notificationPrefs.soundEnabled, setAudioEnabled]);
```

**Update Notification Condition:**

```typescript
if (
  chatMessages.length > prevMessageCountRef.current &&
  prevMessageCountRef.current > 0 &&
  !isWindowFocused &&
  notificationPrefs.enabled
) {
  // ADD THIS
  // ... rest of notification logic

  // Use dynamic throttle value
  if (now - senderLastNotif > notificationPrefs.throttleMs) {
    // ... show notification
  }
}
```

**Add Settings UI (in JSX, before closing chat div):**

```tsx
{
  /* Notification Settings Toggle */
}
<div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', padding: '0.5rem' }}>
  <button
    onClick={() => setShowSettings(!showSettings)}
    className="lk-button"
    style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem' }}
  >
    ⚙️ Notification Settings
  </button>

  {showSettings && (
    <div
      style={{
        marginTop: '0.5rem',
        padding: '0.5rem',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '0.25rem',
      }}
    >
      <label
        style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', cursor: 'pointer' }}
      >
        <input
          type="checkbox"
          checked={notificationPrefs.enabled}
          onChange={(e) => setNotificationPrefs((prev) => ({ ...prev, enabled: e.target.checked }))}
          style={{ marginRight: '0.5rem' }}
        />
        <span style={{ fontSize: '0.875rem' }}>Enable notifications</span>
      </label>

      <label
        style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', cursor: 'pointer' }}
      >
        <input
          type="checkbox"
          checked={notificationPrefs.soundEnabled}
          onChange={(e) =>
            setNotificationPrefs((prev) => ({ ...prev, soundEnabled: e.target.checked }))
          }
          disabled={!notificationPrefs.enabled}
          style={{ marginRight: '0.5rem' }}
        />
        <span
          style={{
            fontSize: '0.875rem',
            color: !notificationPrefs.enabled ? 'rgba(255,255,255,0.3)' : 'inherit',
          }}
        >
          Sound alerts
        </span>
      </label>

      <div style={{ marginTop: '0.5rem' }}>
        <label
          style={{
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.6)',
            display: 'block',
            marginBottom: '0.25rem',
          }}
        >
          Throttle (seconds):
        </label>
        <input
          type="number"
          min="1"
          max="10"
          value={notificationPrefs.throttleMs / 1000}
          onChange={(e) =>
            setNotificationPrefs((prev) => ({
              ...prev,
              throttleMs: parseInt(e.target.value) * 1000,
            }))
          }
          disabled={!notificationPrefs.enabled}
          style={{
            width: '100%',
            padding: '0.25rem',
            borderRadius: '0.25rem',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(0,0,0,0.3)',
            color: 'white',
          }}
        />
      </div>
    </div>
  )}
</div>;
```

**Impact:** User control over notification behavior (fixes Issue #4 from research).

---

### Step 6: Acquire Notification Audio File (30 min)

**Task:** Obtain short notification sound (1-2 seconds, <50KB)

**Sources (CC0/Public Domain):**

1. **Freesound.org:** https://freesound.org/search/?q=notification&f=license:%22Creative+Commons+0%22
2. **Pixabay Audio:** https://pixabay.com/sound-effects/search/notification/
3. **Zapsplat (free tier):** https://www.zapsplat.com/sound-effect-category/notification-alerts/

**Recommended Sound Characteristics:**

- Duration: 0.5-1.5 seconds
- Format: MP3 (best browser support)
- Bitrate: 64-128kbps (keeps file size <50KB)
- Tone: Pleasant, non-jarring (avoid harsh beeps)
- Volume: Moderate (users can adjust system volume)

**File Path:** `/Users/tony/Documents/Vcyber/conf/public/notification.mp3`

**Alternative (Generate with Web Audio API):**
If external file unavailable, generate simple beep programmatically:

```typescript
const generateNotificationBeep = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = 800; // 800Hz tone
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
};
```

**Decision:** Use external MP3 file for better UX (softer, more pleasant sound).

---

## Testing Checklist

### Window Focus Detection

- [ ] Open chat in browser tab
- [ ] Send message from another device/user
- [ ] Verify NO notification while tab focused
- [ ] Switch to different tab (blur)
- [ ] Send another message
- [ ] Verify notification appears

### Rate Limiting

- [ ] Set throttle to 3 seconds
- [ ] Send 5 rapid messages from same sender (1/second)
- [ ] Verify only 1 notification appears (first message)
- [ ] Wait 4 seconds, send another message
- [ ] Verify notification appears (throttle window passed)

### Audio Notifications

- [ ] Enable sound in settings
- [ ] Blur window, receive message
- [ ] Verify audio plays with toast notification
- [ ] Disable sound in settings
- [ ] Blur window, receive message
- [ ] Verify toast appears but no audio

### User Preferences

- [ ] Toggle "Enable notifications" off
- [ ] Blur window, receive message
- [ ] Verify NO notification appears
- [ ] Toggle "Enable notifications" on
- [ ] Verify notifications resume
- [ ] Change throttle to 5 seconds
- [ ] Verify new throttle duration applied
- [ ] Refresh page
- [ ] Verify settings persisted (loaded from localStorage)

---

## Success Criteria

- [ ] Window focus hook correctly detects focus/blur events
- [ ] Notifications suppressed when window focused
- [ ] Rate limiting prevents notification spam (max 1 per sender per throttle duration)
- [ ] Audio plays on notification (after user gesture)
- [ ] Settings UI allows toggling notifications, sound, and throttle duration
- [ ] Preferences persist across page refreshes
- [ ] No console errors
- [ ] No functional regressions (existing chat features work)

---

## Rollback Instructions

If issues occur:

```bash
cd /Users/tony/Documents/Vcyber/conf
git checkout HEAD -- lib/EnhancedChat.tsx
rm public/notification.mp3
```

**Partial rollback (keep color changes from Phase 2):**

1. Use git diff to view changes
2. Manually revert only notification-related code
3. Keep CSS variable color updates

---

## Common Issues & Solutions

### Issue 1: Audio Doesn't Play

**Symptom:** No sound when notification appears
**Cause:** Browser autoplay policy blocks audio without user gesture
**Solution:** Audio plays after first user interaction (chat send, button click). Display one-time prompt:

```tsx
{
  audioBlocked && (
    <div style={{ padding: '0.5rem', background: 'rgba(255,165,0,0.1)', fontSize: '0.75rem' }}>
      Click anywhere to enable sound notifications
    </div>
  );
}
```

### Issue 2: Notifications Still Show When Focused

**Symptom:** Toast appears even when tab active
**Cause:** `document.hasFocus()` returns false in certain browsers
**Solution:** Add visibility API check:

```typescript
const isWindowFocused = useWindowFocus();
const isDocumentVisible = document.visibilityState === 'visible';
const shouldNotify = !isWindowFocused || !isDocumentVisible;
```

### Issue 3: Throttle Not Working

**Symptom:** Multiple notifications from same sender
**Cause:** State update race condition
**Solution:** Use functional setState:

```typescript
setLastNotificationTime((prev) => ({
  ...prev,
  [senderId]: Date.now(), // Use fresh timestamp
}));
```

### Issue 4: Settings Don't Persist

**Symptom:** Preferences reset on page refresh
**Cause:** localStorage not saving (SSR issue)
**Solution:** Verify `typeof window !== 'undefined'` check present before localStorage access

---

## Performance Notes

**Memory Impact:** +1 state object (~100 bytes), +1 audio element (~10KB)
**Audio File Size:** <50KB (negligible)
**localStorage Usage:** ~200 bytes (JSON preferences)
**Re-render Impact:** Minimal (throttling state updates max every 3 seconds)

---

## Accessibility Notes

**Screen Reader Announcements:**
Consider adding ARIA live region for chat messages:

```tsx
<div role="log" aria-live="polite" aria-label="Chat messages">
  {chatMessages.map((msg, idx) => (
    <div key={idx} role="article">
      <div aria-label={`Message from ${msg.from?.identity}`}>{msg.message}</div>
    </div>
  ))}
</div>
```

**Keyboard Navigation:**
Settings toggles should be keyboard-accessible (checkbox elements handle this by default).

**Visual + Audio Feedback:**
Dual notification mode (toast + audio) ensures users with hearing/vision impairments receive alerts.

---

## Code Diff Preview

```diff
+ // Custom hook for window focus detection
+ const useWindowFocus = () => {
+   const [isFocused, setIsFocused] = React.useState(() => {
+     if (typeof document !== 'undefined') {
+       return document.hasFocus();
+     }
+     return true;
+   });
+   // ... hook implementation
+ };

+ // Custom hook for notification audio
+ const useNotificationAudio = () => {
+   // ... hook implementation
+ };

  export function EnhancedChat({ onNewMessage }: EnhancedChatProps = {}) {
    const { send, chatMessages } = useChat();
    const room = useRoomContext();
+   const isWindowFocused = useWindowFocus();
+   const { playNotificationSound, audioEnabled, setAudioEnabled } = useNotificationAudio();
    const [message, setMessage] = React.useState('');
+   const [lastNotificationTime, setLastNotificationTime] = React.useState<Record<string, number>>({});
+   const [notificationPrefs, setNotificationPrefs] = React.useState<NotificationPrefs>(() => {
+     // ... load from localStorage
+   });
+   const [showSettings, setShowSettings] = React.useState(false);

    React.useEffect(() => {
      scrollToBottom();

-     if (chatMessages.length > prevMessageCountRef.current && prevMessageCountRef.current > 0) {
+     if (chatMessages.length > prevMessageCountRef.current &&
+         prevMessageCountRef.current > 0 &&
+         !isWindowFocused &&
+         notificationPrefs.enabled) {
        const newMessage = chatMessages[chatMessages.length - 1];
        const isOwnMessage = newMessage.from?.identity === room.localParticipant.identity;
        const isFileMessage = newMessage.message?.includes('📎') || newMessage.message?.includes('Sent file');
+       const senderId = newMessage.from?.identity || 'unknown';

        if (!isOwnMessage && !isFileMessage) {
+         const now = Date.now();
+         const senderLastNotif = lastNotificationTime[senderId] || 0;
+
+         if (now - senderLastNotif > notificationPrefs.throttleMs) {
            onNewMessage?.();

            setTimeout(() => {
              toast(`💬 ...`, { duration: 4000, position: 'top-right' });
+             playNotificationSound();
            }, 100);
+
+           setLastNotificationTime(prev => ({ ...prev, [senderId]: now }));
+         }
        }
      }
```

---

**Next Step:** Proceed to phase-4-testing.md after implementing all notification features
