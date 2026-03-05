# Frontend Implementation Summary: Google Login + Phone Completion

## Changes Overview

This document summarizes all frontend changes made to support two-stage Google authentication with mandatory phone completion.

---

## 1. Type Definitions ([types/user.d.ts](types/user.d.ts))

```typescript
// Full authenticated user (after phone completion)
export type AuthUser = {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  role: string;
};

// Partial user from Google OAuth (phone may be missing)
export type GoogleAuthUser = {
  id: string;
  username?: string;
  email: string;
  phoneNumber?: string;
  role?: string;
  googleId: string;
};

// Pending Google auth state (incomplete, needs phone)
export type PendingGoogleAuth = {
  googleUser: GoogleAuthUser;
  pendingToken: string; // short-lived token to complete phone
  completionTokenExpiresAt?: number; // timestamp
};
```

---

## 2. Validators Utility ([utils/validators.ts](utils/validators.ts))

**New shared validation functions:**
- `validateEmail(email)` - RFC email pattern
- `validatePhoneNumber(phone)` - 9-15 digits (international safe)
- `validateUsername(username)` - 3+ characters
- `validatePassword(password)` - 8+ characters
- `normalizePhoneNumber(phone)` - Strips non-digits for storage

**Used by:** Register screen, Phone completion screen

---

## 3. Auth Store ([store/auth.ts](store/auth.ts))

**New state:**
- `pendingGoogleAuth: PendingGoogleAuth | null` - Stores incomplete Google auth temporarily
- `isPhoneComplete()` - Helper to check if phone is provided

**New methods:**
- `setPendingGoogleAuth(data)` - Set pending auth state (ephemeral, not persisted)
- Extended `clearSession()` - Now clears both full session AND pending state

**Key behavior:**
- Pending state is NOT persisted to SecureStore (user must complete in same session)
- `hydrate()` never restores pending state (fresh login after app restart)
- Only full session with `accessToken` and `user.phoneNumber` persists

---

## 4. Auth API ([services/api/auth/index.ts](services/api/auth/index.ts))

**New endpoint functions:**

```typescript
// Google OAuth exchange
googleSignIn(payload): Promise<GoogleAuthResponse>
  → POST /api/auth/google
  → Returns: { status: "completed" | "requiresPhone", data: {...} }

// Phone completion for pending users
completePhoneNumber(payload): Promise<CompletePhoneResponse>
  → POST /api/auth/complete-phone
  → Requires: pending token in auth header
  → Returns: { accessToken, refreshToken, user }
```

**Existing endpoints:** `loginUser`, `registerUser`, `refreshTokens`, `logoutUser` (unchanged)

---

## 5. API Client Interceptor ([services/api/client.ts](services/api/client.ts))

**Updated request interceptor:**
```typescript
// For /complete-phone endpoint:
//   Use: pendingToken from zustand store
// For other endpoints:
//   Use: normal accessToken from SecureStore

if (url.includes('/complete-phone') && pendingGoogleAuth?.pendingToken) {
  headers.Authorization = `Bearer ${pendingToken}`;
} else {
  headers.Authorization = `Bearer ${accessToken}`;
}
```

**Updated response interceptor:**
- Don't retry phone completion on 401 (pending token is short-lived, keep error visible)
- Other endpoints still retry with token refresh

---

## 6. Login Screen ([app/(auth)/login.tsx](app/%28auth%29/login.tsx))

**Refactored Google sign-in:**
```typescript
const res = await googleSignIn({ idToken });

if (res.status === "completed") {
  // User has phone, set full session
  await setSession({ user, accessToken, refreshToken });
  router.replace("/(tabs)/index");
} else if (res.status === "requiresPhone") {
  // User needs phone, store pending and redirect
  setPendingGoogleAuth({ googleUser, pendingToken });
  router.replace("/(auth)/complete-phone");
}
```

**Changes:**
- Removed direct `apiClient.post` call in component (now uses service layer)
- Login redirects to home tab `/(tabs)/index` instead of profile
- Added `setPendingGoogleAuth` store call

---

## 7. Phone Completion Screen ([app/(auth)/complete-phone.tsx](app/%28auth%29/complete-phone.tsx)) - NEW

**Purpose:** Allow users to submit phone number to complete Google auth

**Features:**
- Displays pending Google email (read-only)
- Phone input with live validation (9-15 digits)
- Handles duplicate phone error (409) with clear UX
- Handles expired pending token (401) with redirect to login
- "Start over" button to restart Google login

**Flow:**
```
1. Display pending user email
2. Input phone number
3. Submit → POST /api/auth/complete-phone with pending token
4. On success → Set full session → Redirect to home
5. On 409 (duplicate) → Show error, allow retry with different phone
6. On 401 (expired) → Redirect to login, restart
```

---

## 8. Register Screen ([app/(auth)/register.tsx](app/%28auth%29/register.tsx)) - Updated

**Changes:**
- Import phone validators from `@/utils/validators` (not inline)
- Use shared `validatePhoneNumber`, `validatePassword`, `validateUsername`
- Phone validation already required during registration (no change to flow)

---

## 9. New Hook: usePhoneComplete ([hooks/usePhoneComplete.ts](hooks/usePhoneComplete.ts)) - NEW

**Purpose:** Guard protected actions (booking, inquiry, etc.)

```typescript
const { isPhoneComplete, checkPhoneComplete } = usePhoneComplete();

// Usage in protected action (e.g., booking):
const handleBooking = () => {
  checkPhoneComplete(() => {
    // User has phone, proceed with booking
    submitBooking();
  });
  // If no phone:
  // - If pending Google → redirect to phone completion screen
  // - If not logged in → redirect to login
};
```

**Returns:**
- `isPhoneComplete()` - Boolean check
- `checkPhoneComplete(callback?)` - Guards action or redirects

---

## 10. Free vs. Protected Tabs

### Free tabs (accessible to all users, logged in or not):
- `/(tabs)/index` - Home/property list (no auth required)
- `/(tabs)/agent` - Browse agents (no auth required)

### Protected actions within tabs (require phone completion):
- Booking inquiry button → `usePhoneComplete().checkPhoneComplete(...)`
- Listing a property → `usePhoneComplete().checkPhoneComplete(...)`
- Message agent → `usePhoneComplete().checkPhoneComplete(...)`

**Implementation pattern:**
```tsx
<TouchableOpacity onPress={() => {
  checkPhoneComplete(() => {
    // Protected action here
  });
}}>
  <Text>Make Booking</Text>
</TouchableOpacity>
```

---

## 11. Auth Flow Diagram

```
┌─ New User
│  └─ Google Sign-In
│     ├─ GET idToken from Google SDK
│     ├─ POST /api/auth/google
│     ├─ Backend: no phone → Response { status: "requiresPhone", pendingToken }
│     ├─ Frontend: setPendingGoogleAuth() + navigate to complete-phone
│     ├─ User submits phone
│     ├─ POST /api/auth/complete-phone (with pendingToken)
│     ├─ Backend: validates uniqueness → Response { accessToken, refreshToken, user }
│     ├─ Frontend: setSession() + navigate to home
│     └─ ✅ Full access (can book, inquire, etc)
│
├─ Returning Google User (already has phone)
│  └─ Google Sign-In
│     ├─ GET idToken from Google SDK
│     ├─ POST /api/auth/google
│     ├─ Backend: has phone → Response { status: "completed", accessToken, ... }
│     ├─ Frontend: setSession() + navigate to home
│     └─ ✅ Full access
│
└─ Email/Password User
   ├─ Submit register form (with phone)
   ├─ POST /api/users/register
   ├─ Backend: validates phone uniqueness → creates user
   ├─ User logs in with email/password
   ├─ POST /api/users/login
   ├─ Backend: returns full session
   └─ ✅ Full access

Protected Action (e.g., booking):
├─ User attempts booking
├─ checkPhoneComplete() hook evaluates:
│  ├─ Has full session with phone → ✅ Proceed
│  ├─ Has pending Google auth → ❌ Redirect to complete-phone
│  └─ Not logged in → ❌ Redirect to login
└─ If blocked, user completes phone → retry action
```

---

## 12. Session Persistence

### On App Launch
```typescript
// Root layout calls hydrate() on mount
useEffect(() => {
  useAuthStore.getState().hydrate();
}, []);

// hydrate() restores:
// - Full session tokens from SecureStore ✅
// - Pending state is NEVER restored ❌ (users restart Google login)
```

### Session Storage
```typescript
// Persisted (SecureStore):
- token (accessToken)
- refreshToken
- user (full user object with phone)

// NOT persisted (ephemeral):
- pendingGoogleAuth (user must complete in same session)
```

---

## 13. Testing Scenarios

### Scenario 1: New Google user without phone
1. Tap "Continue with Google"
2. Select Google account
3. Redirected to phone completion screen
4. Verify email shown (read-only)
5. Enter phone number
6. Submit → should redirect to home

### Scenario 2: Duplicate phone number
1. First user completes phone: `1234567890`
2. Second user tries same phone
3. Error: "Phone already exists"
4. Allow user to retry with different number

### Scenario 3: Protected action without phone
1. User logged in with Google, pending phone
2. Try to book property
3. Intercepted by `checkPhoneComplete()`
4. Redirect to phone completion screen
5. Complete phone
6. Retry booking → should work

### Scenario 4: Normal registration flow
1. Tap "Create account"
2. Fill form (including phone)
3. Submit → validates uniqueness
4. Success → redirect to login
5. Login normally

### Scenario 5: Expired pending token
1. Complete Google login, get pending token
2. Wait 30+ minutes (if TTL is 30m)
3. Try to submit phone
4. Backend returns 401
5. Redirect to login with message "Session expired"

---

## 14. Files Changed Summary

| File | Change | Impact |
|------|--------|--------|
| [types/user.d.ts](types/user.d.ts) | Created | Type definitions for auth states |
| [utils/validators.ts](utils/validators.ts) | Created | Shared validators (phone, email, etc) |
| [store/auth.ts](store/auth.ts) | Updated | Added pending state, new methods |
| [services/api/auth/index.ts](services/api/auth/index.ts) | Updated | Added googleSignIn, completePhoneNumber |
| [services/api/client.ts](services/api/client.ts) | Updated | Handle pending token in interceptor |
| [app/(auth)/login.tsx](app/%28auth%29/login.tsx) | Updated | Refactored Google flow, use service methods |
| [app/(auth)/complete-phone.tsx](app/%28auth%29/complete-phone.tsx) | Created | New screen for phone completion |
| [app/(auth)/register.tsx](app/%28auth%29/register.tsx) | Updated | Use shared validators |
| [hooks/usePhoneComplete.ts](hooks/usePhoneComplete.ts) | Created | Guard protected actions |

---

## 15. Integration Checklist

- [ ] Backend implements `POST /api/auth/google` (two response types)
- [ ] Backend implements `POST /api/auth/complete-phone` (with pending token auth)
- [ ] Phone uniqueness enforced in MongoDB (unique index)
- [ ] Test Google auth flow end-to-end
- [ ] Test duplicate phone error (409)
- [ ] Test expired pending token (401)
- [ ] Add `checkPhoneComplete()` guard to all booking/inquiry endpoints
- [ ] Verify app restarts don't restore pending auth
- [ ] Test token refresh after phone completion
- [ ] Test logout clears both session and pending state

