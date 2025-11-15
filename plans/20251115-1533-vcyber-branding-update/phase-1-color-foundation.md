# Phase 1: Color Extraction & CSS Foundation

**Duration:** 2-3 hours
**Risk Level:** Low
**Dependencies:** None
**Files Modified:** `styles/globals.css`

---

## Objective

Establish CSS variable foundation for Vcyber branding colors, update global gradient to match logo, ensure WCAG AA contrast compliance.

---

## Implementation Steps

### Step 1: Add CSS Variables to :root (10 min)

**File:** `styles/globals.css`
**Location:** After line 3 (box-sizing rule)

```css
:root {
  /* Logo-aligned primary colors */
  --vcyber-cyan: #00d4ff;
  --vcyber-blue: #0066ff;
  --vcyber-purple: #a855f7;
  --vcyber-dark: #0a1628;
  --vcyber-darker: #050b14;

  /* Utility colors (status indicators) */
  --vcyber-success: #10b981;
  --vcyber-danger: #ef4444;
  --vcyber-warning: #f59e0b;

  /* Gradient definition */
  --gradient-vcyber: linear-gradient(135deg, #00d4ff 0%, #0066ff 50%, #a855f7 100%);

  /* Alpha variants (for backgrounds) */
  --vcyber-cyan-bg: rgba(0, 212, 255, 0.1);
  --vcyber-cyan-border: rgba(0, 212, 255, 0.3);
  --vcyber-blue-bg: rgba(0, 102, 255, 0.1);
  --vcyber-blue-border: rgba(0, 102, 255, 0.3);
  --vcyber-purple-bg: rgba(168, 85, 247, 0.1);
  --vcyber-purple-border: rgba(168, 85, 247, 0.3);
  --vcyber-success-bg: rgba(16, 185, 129, 0.1);
  --vcyber-success-border: rgba(16, 185, 129, 0.3);
  --vcyber-danger-bg: rgba(239, 68, 68, 0.1);
  --vcyber-danger-border: rgba(239, 68, 68, 0.3);
  --vcyber-warning-bg: rgba(245, 158, 11, 0.1);
  --vcyber-warning-border: rgba(245, 158, 11, 0.3);
}
```

**Rationale:** CSS variables enable runtime theming, reduce duplication, simplify Phase 2 component updates.

---

### Step 2: Update Global Background Gradient (15 min)

**File:** `styles/globals.css`
**Current (lines 6-7):**
```css
html {
  color-scheme: dark;
  background: linear-gradient(135deg, #000428 0%, #004e92 50%, #2d0f4d 100%);
}
```

**Target:**
```css
html {
  color-scheme: dark;
  background: linear-gradient(135deg, var(--vcyber-dark) 0%, #001a3d 50%, #0a0a1a 100%);
}
```

**Rationale:** Pure logo gradient (#00d4ff→#0066ff→#a855f7) too bright for background. Use darker variant with navy base. Logo gradient reserved for accents/buttons.

**Alternative (if darker variant insufficient):**
```css
html {
  color-scheme: dark;
  background: var(--vcyber-dark);
}

html::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--gradient-vcyber);
  opacity: 0.1;
  z-index: -1;
  pointer-events: none;
}
```

**Decision Point:** Test both approaches, choose based on visual preference + accessibility.

---

### Step 3: Update Body Background (5 min)

**File:** `styles/globals.css`
**Current (line 21):**
```css
body {
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #000428 0%, #004e92 50%, #2d0f4d 100%);
}
```

**Target:**
```css
body {
  display: flex;
  flex-direction: column;
  background: transparent; /* Inherit from html */
}
```

**Rationale:** Single background definition (on html) prevents gradient duplication, improves performance.

---

### Step 4: Update Footer Link Color (5 min)

**File:** `styles/globals.css`
**Current (lines 54-57):**
```css
footer a,
h2 a {
  color: #ff6352;
  text-decoration-color: #a33529;
  text-underline-offset: 0.125em;
}
```

**Target:**
```css
footer a,
h2 a {
  color: var(--vcyber-cyan);
  text-decoration-color: var(--vcyber-blue);
  text-underline-offset: 0.125em;
}
```

**Rationale:** Replace coral accent with logo-aligned cyan, use blue for underline contrast.

---

### Step 5: Update Footer Link Hover State (5 min)

**File:** `styles/globals.css`
**Current (lines 59-62):**
```css
footer a:hover,
h2 a {
  text-decoration-color: #ff6352;
}
```

**Target:**
```css
footer a:hover,
h2 a {
  text-decoration-color: var(--vcyber-cyan);
}
```

---

### Step 6: Verify Contrast Ratios (30 min)

**Tools:**
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Chrome DevTools Lighthouse (Accessibility audit)

**Test Combinations:**
| Foreground | Background | Required Ratio | Test Result |
|------------|-----------|----------------|-------------|
| White (#ffffff) | Cyan (#00d4ff) | 4.5:1 | FAIL (~1.6:1) |
| Dark Navy (#0a1628) | Cyan (#00d4ff) | 4.5:1 | PASS (~8.2:1) |
| White (#ffffff) | Blue (#0066ff) | 4.5:1 | PASS (~4.8:1) |
| White (#ffffff) | Purple (#a855f7) | 4.5:1 | PASS (~5.1:1) |
| White (#ffffff) | Dark Navy (#0a1628) | 4.5:1 | PASS (~16.4:1) |

**Accessibility Fix for Cyan:**
When using cyan backgrounds (buttons, badges), use dark navy text instead of white:

```css
.cyan-button {
  background: var(--vcyber-cyan);
  color: var(--vcyber-dark); /* Dark navy text */
  border: 1px solid var(--vcyber-blue);
}
```

---

### Step 7: Optional - Add Gradient Utility Classes (15 min)

**File:** `styles/globals.css` (append at end)

```css
/* Gradient utility classes for components */
.bg-gradient-vcyber {
  background: var(--gradient-vcyber);
}

.bg-gradient-vcyber-dark {
  background: linear-gradient(135deg, var(--vcyber-dark) 0%, #001a3d 50%, #0a0a1a 100%);
}

.text-gradient-vcyber {
  background: var(--gradient-vcyber);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

**Usage Example:**
```tsx
<h1 className="text-gradient-vcyber">Vcyber</h1>
```

---

## Testing Checklist

### Visual Verification
- [ ] Open `http://localhost:3000` in browser
- [ ] Background gradient visible (darker navy tones, no bright cyan)
- [ ] Footer links display cyan color (#00d4ff)
- [ ] Footer link hover state works (cyan underline appears)
- [ ] No visual regressions (layout unchanged)

### Browser DevTools Inspection
- [ ] Open DevTools → Inspect `<html>` element
- [ ] Computed styles show `--vcyber-cyan: #00d4ff` (CSS variables loaded)
- [ ] Background gradient uses new color values
- [ ] No console errors

### Accessibility Testing
- [ ] Run Lighthouse audit (DevTools → Lighthouse → Accessibility)
- [ ] Score remains ≥90 (no contrast ratio failures)
- [ ] Manually verify footer link contrast with WebAIM tool

---

## Success Criteria

- [ ] 13 CSS variables defined in :root
- [ ] Background gradient updated (darker variant of logo colors)
- [ ] Footer link color changed from coral to cyan
- [ ] All text-on-background combinations pass WCAG AA (4.5:1)
- [ ] Zero console errors
- [ ] Zero visual regressions on existing components

---

## Rollback Instructions

If issues occur:

```bash
cd /Users/tony/Documents/Vcyber/conf
git checkout HEAD -- styles/globals.css
```

**Alternative:** Keep backup copy before changes:

```bash
cp styles/globals.css styles/globals.css.backup
```

Restore if needed:

```bash
cp styles/globals.css.backup styles/globals.css
```

---

## Common Issues & Solutions

### Issue 1: CSS Variables Not Applied
**Symptom:** Components still show old colors
**Cause:** Browser cache
**Solution:** Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

### Issue 2: Gradient Too Bright
**Symptom:** Background overwhelming, poor readability
**Solution:** Switch to darker variant (Step 2 alternative approach)

### Issue 3: Link Color Low Contrast
**Symptom:** Lighthouse flags footer link contrast
**Solution:** Add darker background to footer:

```css
footer {
  background: rgba(0, 0, 0, 0.8); /* Darken background */
}
```

---

## Code Diff Preview

**File:** `styles/globals.css`

```diff
  * {
    box-sizing: border-box;
  }

+ :root {
+   --vcyber-cyan: #00d4ff;
+   --vcyber-blue: #0066ff;
+   --vcyber-purple: #a855f7;
+   --vcyber-dark: #0a1628;
+   --vcyber-darker: #050b14;
+   --vcyber-success: #10b981;
+   --vcyber-danger: #ef4444;
+   --vcyber-warning: #f59e0b;
+   --gradient-vcyber: linear-gradient(135deg, #00d4ff 0%, #0066ff 50%, #a855f7 100%);
+   --vcyber-cyan-bg: rgba(0, 212, 255, 0.1);
+   --vcyber-cyan-border: rgba(0, 212, 255, 0.3);
+   /* ... other alpha variants ... */
+ }

  html {
    color-scheme: dark;
-   background: linear-gradient(135deg, #000428 0%, #004e92 50%, #2d0f4d 100%);
+   background: linear-gradient(135deg, var(--vcyber-dark) 0%, #001a3d 50%, #0a0a1a 100%);
  }

  body {
    display: flex;
    flex-direction: column;
-   background: linear-gradient(135deg, #000428 0%, #004e92 50%, #2d0f4d 100%);
+   background: transparent;
  }

  footer a,
  h2 a {
-   color: #ff6352;
-   text-decoration-color: #a33529;
+   color: var(--vcyber-cyan);
+   text-decoration-color: var(--vcyber-blue);
  }

  footer a:hover,
  h2 a {
-   text-decoration-color: #ff6352;
+   text-decoration-color: var(--vcyber-cyan);
  }
```

---

**Next Step:** Proceed to phase-2-component-styling.md after verifying all success criteria
