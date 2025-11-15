# Vcyber Branding Update & Chat Notification Enhancement Plan

**Plan Created:** 2025-11-15 15:33
**Scope:** Color scheme alignment with logo branding + chat notification UX improvements
**Complexity:** Medium (4 phases, estimated 12-16 hours)
**Risk Level:** Low (visual changes + isolated notification logic)

---

## Executive Summary

Update Vcyber's visual identity from current blue-purple gradient (#000428→#004e92→#2d0f4d) to logo-aligned cyan-blue-purple gradient (#00d4ff→#0066ff→#a855f7) on dark navy (#0a1628). Replace coral accent (#ff6352) with cyan (#00d4ff) for primary actions. Fix chat notifications to respect window focus, implement rate limiting, add audio alerts, and provide user preferences.

**Key Changes:**
- Extract 5-color palette from logo gradient
- Establish CSS variable system for runtime theming
- Update 4 component files (UnifiedMenu, RecordingControls, ParticipantManager, EnhancedChat)
- Implement window focus detection hook
- Add notification throttling (3s per sender)
- Integrate audio notification system
- Create notification preferences UI

**Success Metrics:**
- All colors match logo gradient stops
- WCAG AA contrast compliance (4.5:1 minimum)
- Zero notifications when window focused
- Max 1 notification per sender per 3 seconds
- Audio plays on user interaction

---

## Phase Structure

### Phase 1: Color Extraction & CSS Foundation
**Duration:** 2-3 hours
**Files:** `styles/globals.css`, `tailwind.config.ts` (optional)
**Details:** [phase-1-color-foundation.md](./phase-1-color-foundation.md)

Extract logo colors into CSS variables, update global gradient, establish theming system. No Tailwind required (research shows CSS variables sufficient for this codebase).

### Phase 2: Component Styling Updates
**Duration:** 4-5 hours
**Files:** `lib/UnifiedMenu.tsx`, `lib/RecordingControls.tsx`, `lib/ParticipantManager.tsx`, `lib/EnhancedChat.tsx`
**Details:** [phase-2-component-styling.md](./phase-2-component-styling.md)

Replace inline rgba colors with CSS variable references. Update button backgrounds, borders, notification badges, and status indicators.

### Phase 3: Chat Notification Enhancements
**Duration:** 4-6 hours
**Files:** `lib/EnhancedChat.tsx`, `public/notification.mp3` (new)
**Details:** [phase-3-notification-fixes.md](./phase-3-notification-fixes.md)

Implement window focus detection, sender-based rate limiting, audio notifications, and user preference toggles.

### Phase 4: Testing & Verification
**Duration:** 2-3 hours
**Files:** All modified files
**Details:** [phase-4-testing.md](./phase-4-testing.md)

Accessibility testing (contrast ratios), cross-browser validation, notification behavior verification, mobile responsiveness.

---

## Color Palette (Logo-Aligned)

### Primary Colors
```css
--vcyber-cyan: #00d4ff       /* Primary accent, buttons, links */
--vcyber-blue: #0066ff       /* Secondary accent, hover states */
--vcyber-purple: #a855f7     /* Tertiary accent, highlights */
--vcyber-dark: #0a1628       /* Background base */
--vcyber-darker: #050b14     /* Deep backgrounds */
```

### Utility Colors (Status & Feedback)
```css
--vcyber-success: #10b981    /* Approval, success actions */
--vcyber-danger: #ef4444     /* Kick, deny, recording */
--vcyber-warning: #f59e0b    /* Waiting room, pause */
```

### Gradient Definition
```css
--gradient-vcyber: linear-gradient(135deg, #00d4ff 0%, #0066ff 50%, #a855f7 100%)
```

---

## Current vs. Target State

### Background Gradient
- **Current:** `linear-gradient(135deg, #000428 0%, #004e92 50%, #2d0f4d 100%)`
- **Target:** `linear-gradient(135deg, #00d4ff 0%, #0066ff 50%, #a855f7 100%)` (with dark overlay)

### Accent Colors
- **Current:** Coral `#ff6352` for links
- **Target:** Cyan `#00d4ff` for primary actions

### Component Inline Colors (4 files)
| Component | Current Colors | Target Variables |
|-----------|---------------|------------------|
| UnifiedMenu | `rgba(0,102,255,0.3)`, `rgba(255,0,0,0.3)`, `rgba(0,255,0,0.3)`, `rgba(153,51,255,0.3)` | `var(--vcyber-blue)`, `var(--vcyber-danger)`, `var(--vcyber-success)`, `var(--vcyber-purple)` |
| RecordingControls | `rgba(255,0,0,0.6)`, `rgba(255,165,0,0.6)`, `rgba(0,255,0,0.6)` | `var(--vcyber-danger)`, `var(--vcyber-warning)`, `var(--vcyber-success)` |
| ParticipantManager | `rgba(153,51,255,0.8)`, `rgba(255,165,0,0.1)`, `rgba(0,255,0,0.3)`, `rgba(255,0,0,0.3)` | `var(--vcyber-purple)`, `var(--vcyber-warning-bg)`, `var(--vcyber-success)`, `var(--vcyber-danger)` |
| EnhancedChat | `rgba(0,102,255,0.1)`, `rgba(0,102,255,0.3)`, `rgba(0,255,0,0.3)` | `var(--vcyber-blue-bg)`, `var(--vcyber-blue)`, `var(--vcyber-success)` |

---

## Chat Notification Fixes (Research-Backed)

### Issue 1: Window Focus Detection (FIXED)
**Current:** Notifies even when chat visible
**Solution:** `useWindowFocus()` hook + `document.hasFocus()` check
**Reference:** NOTIFICATION_RESEARCH.md lines 16-19

### Issue 2: Notification Spam (FIXED)
**Current:** Burst messages create multiple toasts
**Solution:** Per-sender throttling (3s minimum between notifications)
**Reference:** NOTIFICATION_RESEARCH.md lines 84-100

### Issue 3: Audio Alerts (NEW)
**Current:** Visual-only notifications
**Solution:** Web Audio API with `/notification.mp3`, user gesture required
**Reference:** NOTIFICATION_RESEARCH.md lines 105-131

### Issue 4: User Preferences (NEW)
**Current:** No control over notification behavior
**Solution:** Toggles for enable/disable, sound, mentions-only, throttle duration
**Reference:** NOTIFICATION_RESEARCH.md lines 136-155

---

## Implementation Sequence

**Recommended Order (minimize merge conflicts + incremental testing):**

1. **Phase 1 (Foundation)** - CSS variables setup (no breaking changes)
2. **Phase 2 (Visual)** - Component styling (isolated changes per file)
3. **Phase 3 (Functional)** - Notification logic (isolated to EnhancedChat.tsx)
4. **Phase 4 (Validation)** - Accessibility + cross-browser testing

**Parallel Tasks Allowed:**
- Phase 2 component updates can be done in parallel (4 independent files)
- Phase 3 audio file acquisition can happen during Phase 1-2

**Sequential Dependencies:**
- Phase 2 requires Phase 1 CSS variables
- Phase 4 requires Phase 1-3 completion

---

## Risk Assessment

### Low Risk Items
- CSS variable addition (non-breaking, fallback to inline styles)
- Component color updates (visual only, no logic changes)
- Window focus detection (additive, doesn't break existing flow)

### Medium Risk Items
- Notification throttling (could suppress legitimate notifications if misconfigured)
- Audio notification (browser autoplay restrictions may block)
- Gradient accessibility (cyan luminosity requires contrast testing)

### Mitigation Strategies
- **Throttling:** Make duration configurable (default 3s, user can adjust)
- **Audio:** Graceful degradation (visual toast always shows, audio optional)
- **Contrast:** Add semi-transparent dark overlay on gradient backgrounds for text

---

## Rollback Plan

**Phase 1:** Revert `styles/globals.css` to git HEAD
**Phase 2:** Revert individual component files via `git checkout -- <file>`
**Phase 3:** Remove `useWindowFocus` hook + throttling state, keep existing notification logic
**Phase 4:** N/A (testing phase, no code changes)

**Critical Checkpoint:** After Phase 1, verify gradient renders correctly before Phase 2

---

## Success Criteria

### Visual Identity
- [ ] Background gradient matches logo (#00d4ff → #0066ff → #a855f7)
- [ ] All accent colors use cyan/blue/purple palette (no coral/orange except warnings)
- [ ] Dark navy background (#0a1628) applied consistently
- [ ] Footer link color updated from #ff6352 to #00d4ff

### Accessibility
- [ ] All text-on-gradient meets WCAG AA (4.5:1 contrast)
- [ ] Button states have clear visual feedback
- [ ] Color is not sole indicator of state (icons + text labels present)

### Notification Behavior
- [ ] Zero notifications when window focused
- [ ] Max 1 notification per sender per 3 seconds
- [ ] Audio plays after user interaction (no autoplay errors)
- [ ] Notification preferences persist in localStorage
- [ ] File transfer notifications not duplicated (existing behavior maintained)

### Technical Quality
- [ ] No console errors in browser
- [ ] No TypeScript compilation errors
- [ ] Mobile responsive (tested 375px, 768px, 1024px widths)
- [ ] Works in Chrome, Firefox, Safari latest versions

---

## Unresolved Questions

1. **Audio file:** Should notification.mp3 be short beep (200ms) or longer chime (1s)?
2. **Notification preferences UI:** Settings modal in UnifiedMenu dropdown vs. dedicated settings page?
3. **@mentions priority:** Should @mentions always notify regardless of focus state?
4. **Color accent for warnings:** Keep orange (#f59e0b) or use purple gradient stop?
5. **Gradient overlay opacity:** 0.3, 0.5, or 0.7 for text overlay on cyan gradient?

**Resolution Timing:** Phase 3 (audio), Phase 3 (preferences UI), others can be decided during implementation

---

## Dependencies

### External Files Required
- **Audio file:** `/public/notification.mp3` (50KB max, ~1-2 seconds duration)
  - **Acquisition:** Free sources (Freesound.org, Pixabay), CC0 license recommended
  - **Format:** MP3 (best browser support), 64kbps quality sufficient

### No Package Installations Required
- React hooks (useState, useEffect, useRef) - already available
- Web Audio API - native browser API
- localStorage - native browser API
- CSS variables - native CSS feature

---

## Notes

- **Research reports utilized:** 2 documents (color-scheme-research.md, NOTIFICATION_RESEARCH.md)
- **Token efficiency:** Phase details separated into linked files for progressive disclosure
- **Accessibility priority:** WCAG AA compliance mandatory, AAA aspirational
- **Browser support:** Modern evergreen browsers (Chrome 90+, Firefox 88+, Safari 14+)
- **Mobile-first:** All color updates respect existing responsive breakpoints
- **No Tailwind config:** Codebase uses CSS modules + inline styles, CSS variables sufficient

---

**Next Step:** Review phase-1-color-foundation.md for detailed CSS variable setup instructions
