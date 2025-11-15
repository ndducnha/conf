# Chat Notification Best Practices Research & Implementation Plan

## CURRENT ISSUES IDENTIFIED

### Critical Issues

1. **Self-notifications already fixed** - Code correctly checks `isOwnMessage` (line 41), so self-notification is NOT occurring.
2. **Rapid message burst handling** - No rate limiting; bursts can spam multiple toasts simultaneously.
3. **No window focus detection** - Notifications show even when user is actively in the chat window.
4. **No audio alerts** - Only visual toasts; important for distracted users.
5. **Missing notification preferences** - No user control over notification behavior.

## BEST PRACTICES FROM RESEARCH

### 1. Window Focus Detection Pattern

Modern chat apps (Teams, Discord, Slack) suppress notifications when tab is focused:

- Use `document.hasFocus()` to check if window has focus
- Listen to 'focus' and 'blur' events via custom hook
- Skip notifications if document.hasFocus() === true
- Browser autoplay policy allows audio only after user gesture

### 2. Rate Limiting Strategy

Prevent notification fatigue:

- Max 1 notification per 2-3 seconds for same sender
- Buffer rapid messages into single notification
- Track last notification time by sender

### 3. Audio Notification Approach

Work WITH browser autoplay restrictions:

- Cannot autoplay audio without prior user interaction
- Require user to click "Enable Notifications" once
- Use Web Audio API or simple audio element
- Keep audio file size minimal (<50KB)

### 4. Notification Preferences (User Control)

Critical for user satisfaction:

- Toggle notifications on/off
- Separate settings: @mentions, new messages, reactions
- "Do not disturb" mode during meetings
- Notification timeout settings

### 5. Accessibility Considerations

- Visible toast + audio alerts for multi-modal feedback
- Screen reader announcements for new messages
- High contrast notification colors
- Sufficient duration for message reading

## SPECIFIC FIXES FOR EnhancedChat.tsx

### Fix #1: Add Window Focus Detection (Lines 35-58)

```typescript
// Create hook for window focus
const useWindowFocus = () => {
  const [isFocused, setIsFocused] = React.useState(true);

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

Add to component:

```typescript
const isWindowFocused = useWindowFocus();

// Modify notification logic (line 39):
if (chatMessages.length > prevMessageCountRef.current &&
    prevMessageCountRef.current > 0 &&
    !isWindowFocused) {  // ADD THIS
```

**Impact:** Notifications only show when user is NOT viewing the tab.

### Fix #2: Add Rate Limiting (New State)

```typescript
const [lastNotificationTime, setLastNotificationTime] = React.useState<Record<string, number>>({});
const NOTIFICATION_THROTTLE_MS = 3000; // 3-second minimum between notifications

// In notification block (replace line 49-54):
const now = Date.now();
const senderLastNotif = lastNotificationTime[newMessage.from?.identity || ''] || 0;

if (now - senderLastNotif > NOTIFICATION_THROTTLE_MS) {
  toast(`💬 ${newMessage.from?.name}: ${newMessage.message.substring(0, 50)}...`);
  setLastNotificationTime((prev) => ({
    ...prev,
    [newMessage.from?.identity || '']: now,
  }));
}
```

**Impact:** Max 1 notification per sender every 3 seconds, preventing spam.

### Fix #3: Add Audio Notification Setup

```typescript
// New hook for notification audio
const useNotificationAudio = () => {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    // Create silent audio element - must be user-initialized
    audioRef.current = new Audio('/notification.mp3');
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .catch((err) => console.debug('Audio play failed (user gesture required):', err));
    }
  };

  return playNotificationSound;
};

// Usage in notification block:
const playSound = useNotificationAudio();
// After toast:
playSound();
```

**Requirements:** Add `/public/notification.mp3` (short alert sound ~2-3 seconds).

### Fix #4: Notification Preferences State

```typescript
interface NotificationPrefs {
  enabled: boolean;
  soundEnabled: boolean;
  notifyMentionsOnly: boolean;
  throttleMs: number;
}

const [notificationPrefs, setNotificationPrefs] = React.useState<NotificationPrefs>({
  enabled: true,
  soundEnabled: true,
  notifyMentionsOnly: false,
  throttleMs: 3000,
});

// Check against preferences before notifying:
if (notificationPrefs.enabled && !isWindowFocused) {
  // ... notification code
}
```

## IMPLEMENTATION PRIORITY

1. **HIGH (Essential)** - Fix #1: Window focus detection
2. **HIGH (Important)** - Fix #2: Rate limiting by sender
3. **MEDIUM** - Fix #3: Audio notifications (requires notification.mp3)
4. **MEDIUM** - Fix #4: User preferences UI/settings

## TESTING CHECKLIST

- [ ] Notification does NOT appear when tab is focused
- [ ] Notification DOES appear when tab is blurred (background)
- [ ] Rapid messages (3+ in 1 sec) only generate 1 notification per sender
- [ ] 4-second toast duration sufficient to read preview
- [ ] Audio plays without error when sound enabled
- [ ] No notifications for self-messages (already working)
- [ ] File transfer notifications not duplicated
- [ ] Screen reader announces new messages

## UNRESOLVED QUESTIONS

1. Should message bursts buffer into single notification with count badge?
2. Where should notification preferences UI live? (settings modal/sidebar?)
3. Should @mentions always notify regardless of focus state?
4. Browser permission request timing - on first message or settings init?
5. Persist notification preferences to localStorage vs. backend?
