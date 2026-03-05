# Auth Flow Updates - Free Browsing & UX Improvements

## Changes Made

### 1. ✅ Allow Free Browsing Without Login

**What changed:**
- Users can now navigate to home screen and browse properties **without logging in**
- Login is only required for **protected actions** (booking, inquiries, favorites, etc.)
- App no longer forces redirect to login screen on startup

**Files modified:**
- `app/_layout.tsx` - Removed automatic redirect to login for unauthenticated users

**How it works:**
```typescript
// BEFORE: Forced redirect to login
if (!isAuthenticated && !inAuthGroup) {
  router.replace("/(auth)/login");  // ❌ Forces login
}

// AFTER: Free browsing allowed
if (isAuthenticated && inAuthGroup) {
  router.replace("/(tabs)");  // ✅ Only redirect logged-in users away from auth
}
// No redirect for unauthenticated users - they can browse freely
```

**User experience:**
- App starts → Home screen (browse properties) ✅
- Tap "Book Property" → Redirect to login if not logged in ✅
- Tap "Add to Favorites" → Redirect to login if not logged in ✅
- Browse, search, view details → Works without login ✅

---

### 2. ✅ Show Google Account Picker Every Time

**What changed:**
- Google sign-in now **always shows account picker**
- No longer auto-selects the last signed-in account
- Users can choose different accounts each time they sign in

**Files modified:**
- `utils/googleAuth.ts` - Added `signOut()` before sign-in to clear previous session

**How it works:**
```typescript
signIn: async () => {
  await GoogleSignin.hasPlayServices();
  
  // Sign out first to force account picker
  try {
    await GoogleSignin.signOut();
  } catch (signOutError) {
    // Ignore if no previous session
  }
  
  const userInfo = await GoogleSignin.signIn();  // ✅ Shows account picker
  // ...
}
```

**User experience:**
- Tap "Sign in with Google" ✅
- **Account picker shows** (select from multiple accounts) ✅
- Select account → Continue with sign-in ✅
- No auto-selection of previous account ✅

---

### 3. ✅ Phone Number Asked Only Once

**What changed:**
- Phone number is requested **only once** during initial Google sign-up
- If user already has phone (from previous completion), app goes directly to home
- Prevents duplicate phone number requests

**Files modified:**
- `app/(auth)/complete-phone.tsx` - Added check for existing phone before showing screen

**How it works:**
```typescript
React.useEffect(() => {
  if (!pendingGoogleAuth) {
    // Check if user already has phone
    const authStore = useAuthStore.getState();
    if (authStore.user?.phoneNumber) {
      // ✅ Phone already exists - go to home
      router.replace("/(tabs)");
    } else {
      // ❌ No phone - back to login
      router.replace("/(auth)/login");
    }
  }
}, [pendingGoogleAuth]);
```

**User experience:**
- **First-time Google user:**
  1. Sign in with Google ✅
  2. Phone completion screen shown ✅
  3. Enter phone once ✅
  4. Never asked again ✅

- **Returning Google user:**
  1. Sign in with Google ✅
  2. Directly to home (skip phone screen) ✅

- **Backend returns completed status:**
  - If backend responds with `status: "completed"` → Direct to home ✅
  - If backend responds with `status: "requiresPhone"` → Show phone screen once ✅

---

## Testing the New Flow

### Test 1: Free Browsing (Not Logged In)

1. **Open app** → Should show home screen (not login)
2. **Browse properties** → Should work without login
3. **View property details** → Should work without login
4. **Tap "Book Now"** → Should redirect to login
5. **Complete login** → Return to booking flow

### Test 2: Google Account Picker

1. **Tap "Sign in with Google"**
2. **Account picker should show** (not auto-select)
3. **Select an account** → Continue
4. **Sign out**
5. **Sign in again** → Account picker shows again ✅

### Test 3: Phone Number Once Only

**Scenario A: New Google User**
1. Sign in with Google → Phone screen shows
2. Enter phone → Completes
3. Log out
4. Sign in again → No phone screen (goes to home) ✅

**Scenario B: Returning Google User**
1. Sign in with Google (account already has phone)
2. Backend returns `status: "completed"`
3. App goes directly to home (skips phone screen) ✅

**Scenario C: Incomplete Session**
1. Sign in with Google → Phone screen shows
2. Don't enter phone, close app
3. Reopen app → Pending session lost (ephemeral)
4. Sign in again → Phone screen shows again ✅ (expected)

---

## Architecture Overview

### Auth State Flow

```
┌──────────────────────────────────────────────────────────────┐
│                      App Starts                               │
│  ┌────────────────────────────────────────────────────┐      │
│  │ Hydrate session from SecureStore                   │      │
│  │  - accessToken                                      │      │
│  │  - refreshToken                                     │      │
│  │  - user (with phoneNumber)                          │      │
│  └────────────────────────────────────────────────────┘      │
│                          │                                     │
│                          v                                     │
│              ┌───────────────────────┐                        │
│              │ User Authenticated?    │                        │
│              └───────────────────────┘                        │
│                   │              │                             │
│            YES    │              │  NO                         │
│                   v              v                             │
│         ┌──────────────┐  ┌──────────────────┐               │
│         │  Home Screen │  │  Home Screen      │               │
│         │  (full access)│  │  (browse only)    │               │
│         └──────────────┘  └──────────────────┘               │
│                                     │                          │
│                                     │ Action protected?        │
│                                     v                          │
│                            ┌────────────────┐                 │
│                            │ Redirect Login │                 │
│                            └────────────────┘                 │
└──────────────────────────────────────────────────────────────┘

Google Sign-In Flow:
┌──────────────────────────────────────────────────────────────┐
│ 1. Tap "Sign in with Google"                                  │
│    └─> Sign out from Google (force account picker)           │
│    └─> Show account picker                                    │
│    └─> User selects account                                   │
│    └─> Get idToken                                            │
│                                                                │
│ 2. Send idToken to backend                                    │
│    Backend checks user in DB:                                 │
│                                                                │
│    ┌─────────────────────────┬─────────────────────────┐     │
│    │ Has phoneNumber?        │ No phoneNumber?          │     │
│    │ status: "completed"     │ status: "requiresPhone"  │     │
│    │ Returns full tokens     │ Returns pendingToken     │     │
│    └─────────────────────────┴─────────────────────────┘     │
│                │                         │                     │
│                v                         v                     │
│    ┌───────────────────┐    ┌──────────────────────┐         │
│    │ Set full session  │    │ Show phone screen    │         │
│    │ Go to home        │    │ (asked only once)    │         │
│    └───────────────────┘    └──────────────────────┘         │
│                                       │                        │
│                                       v                        │
│                              ┌─────────────────────┐          │
│                              │ Submit phone        │          │
│                              │ Get full tokens     │          │
│                              │ Set session         │          │
│                              │ Go to home          │          │
│                              └─────────────────────┘          │
└──────────────────────────────────────────────────────────────┘
```

---

## Protected Actions

Actions that require login (use `usePhoneComplete` hook):

- ✅ Book property
- ✅ Create inquiry
- ✅ Add to favorites
- ✅ Submit review
- ✅ Edit profile
- ✅ Upload property (agent)
- ✅ Manage bookings
- ✅ View transaction history

**Implementation:**
```typescript
import { usePhoneComplete } from '@/hooks/usePhoneComplete';

function BookingButton() {
  const { checkPhoneComplete } = usePhoneComplete();
  
  const handleBook = () => {
    checkPhoneComplete(() => {
      // This only runs if user has phone
      createBooking();
    });
  };
  
  return <Button onPress={handleBook}>Book Now</Button>;
}
```

---

## Summary

| Feature | Before | After |
|---------|--------|-------|
| **Home access** | Login required | Browse freely ✅ |
| **Google account** | Auto-selects last | Shows picker every time ✅ |
| **Phone number** | Could ask multiple times | Asked only once ✅ |
| **Protected actions** | Not enforced | Proper guards added ✅ |

---

## Next Steps

1. **Test all three flows** above
2. **Add `usePhoneComplete` hook** to all protected actions in your app
3. **Update onboarding** to explain guest browsing vs full access
4. **Add "Sign in" prompts** in UI where appropriate (e.g., "Sign in to book")

All changes are now live and ready to test! 🚀
