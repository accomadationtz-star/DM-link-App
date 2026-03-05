# Fix: Infinite Loop in Zustand Selector

## Problem

When navigating to the complete-phone screen after Google login, you got this error:

```
ERROR  The result of getSnapshot should be cached to avoid an infinite loop
ERROR  [Error: Maximum update depth exceeded. This can happen when a component 
repeatedly calls setState inside componentWillUpdate or componentDidUpdate. 
React limits the number of nested updates to prevent infinite loops.]
```

The app would crash with an infinite re-render cycle.

---

## Root Cause

**Zustand selectors with object literals cause infinite loops:**

```typescript
// ❌ WRONG - Creates new object every render
const { pendingGoogleAuth, setSession, clearSession } = useAuthStore(
  (state) => ({  // ← NEW OBJECT EVERY RENDER
    pendingGoogleAuth: state.pendingGoogleAuth,
    setSession: state.setSession,
    clearSession: state.clearSession,
  })
);
```

### Why this causes a loop:

1. Component renders → selector returns **new object** `{a, b, c}`
2. Zustand detects reference change (new object) → triggers re-render
3. Component re-renders → selector returns **new object** `{a, b, c}` again
4. Zustand detects reference change → triggers re-render
5. ... infinite loop 🔄

---

## Solution Applied

✅ **Changed to separate hooks** (each one memoized individually):

```typescript
// ✅ RIGHT - Stable reference per value
const pendingGoogleAuth = useAuthStore((state) => state.pendingGoogleAuth);
const setSession = useAuthStore((state) => state.setSession);
const clearSession = useAuthStore((state) => state.clearSession);
```

### Why this works:

1. Each hook selector returns a **primitive value or function** (not new object)
2. Zustand's `(state) => state.x` pattern includes automatic referential equality
3. No infinite loop because each value only changes when the state actually changes
4. Same behavior, no render cycles

---

## File Fixed

**`app/(auth)/complete-phone.tsx`**

```diff
- const { pendingGoogleAuth, setSession, clearSession } = useAuthStore(
-   (state) => ({
-     pendingGoogleAuth: state.pendingGoogleAuth,
-     setSession: state.setSession,
-     clearSession: state.clearSession,
-   })
- );

+ const pendingGoogleAuth = useAuthStore((state) => state.pendingGoogleAuth);
+ const setSession = useAuthStore((state) => state.setSession);
+ const clearSession = useAuthStore((state) => state.clearSession);
```

---

## Comparison: What Your Code Already Had

Your **login.tsx** was already correct:

```typescript
// ✅ CORRECT - separate hooks
const setSession = useAuthStore((s) => s.setSession);
const setPendingGoogleAuth = useAuthStore((s) => s.setPendingGoogleAuth);
```

The complete-phone screen just needed the same pattern.

---

## Testing

Try again:

1. **Tap "Sign in with Google"**
2. **Select your Google account**
3. **Should navigate to phone completion screen** (no crash)
4. **Enter phone number**
5. **Tap "Complete sign up"** (should work)

---

## Best Practices with Zustand

### ✅ DO: Use separate hooks
```typescript
const user = useAuthStore((s) => s.user);
const token = useAuthStore((s) => s.token);
const setSession = useAuthStore((s) => s.setSession);
```

### ✅ DO: Use shallow if you need multiple props
```typescript
import { useShallow } from 'zustand/react';

const { user, token } = useAuthStore(
  useShallow((state) => ({
    user: state.user,
    token: state.token,
  }))
);
```

### ❌ DON'T: Use object literals in selectors
```typescript
// Never do this:
const { user, token } = useAuthStore((state) => ({
  user: state.user,
  token: state.token,  // ← Infinite loop!
}));
```

### ❌ DON'T: Create new objects in selectors
```typescript
// Also wrong:
const data = useAuthStore((state) => ({
  ...state.user,  // ← New object
  extraField: true
}));
```

---

## Why This Matters

Zustand's memoization is based on **reference equality**:
- `(state) => state.x` ← Same ref if `state.x` didn't change ✅
- `(state) => ({x: state.x})` ← Always new ref, always triggers re-render ❌

This is a common Zustand gotcha. Always use precise selectors.

---

## Summary

**Fixed:** Infinite loop in `complete-phone.tsx` Zustand selector
**By:** Using separate hooks instead of object literal selector
**Result:** App now navigates to phone completion screen without crashing ✅

Try the Google login flow again - it should work smoothly now!
