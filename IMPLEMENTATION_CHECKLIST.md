# Implementation Checklist & File Changes

## Frontend Implementation Complete ✅

All frontend code has been implemented. Use this checklist to verify everything is working before connecting to backend.

---

## Files Created (New)

| File | Purpose | Type |
|------|---------|------|
| `types/user.d.ts` | Auth types (AuthUser, GoogleAuthUser, PendingGoogleAuth) | Types |
| `utils/validators.ts` | Shared validators (email, phone, password, username) | Utility |
| `hooks/usePhoneComplete.ts` | Guard hook for protected actions | Hook |
| `app/(auth)/complete-phone.tsx` | Phone completion screen for Google users | Screen |
| `BACKEND_IMPLEMENTATION_GUIDE.md` | Complete backend implementation instructions | Documentation |
| `FRONTEND_IMPLEMENTATION_SUMMARY.md` | Frontend changes summary | Documentation |
| `HOW_TO_PROTECT_ACTIONS.md` | Guide for protecting actions with phone check | Documentation |

---

## Files Modified (Updated)

| File | Changes |
|------|---------|
| `store/auth.ts` | Added pendingGoogleAuth state, setPendingGoogleAuth method, isPhoneComplete() helper |
| `services/api/auth/index.ts` | Added googleSignIn() and completePhoneNumber() functions with proper types |
| `services/api/client.ts` | Added pending token handling in request interceptor, special handling for /complete-phone |
| `app/(auth)/login.tsx` | Refactored Google handler to branch on response status, use service methods |
| `app/(auth)/register.tsx` | Import and use shared validators from utils/validators.ts |

---

## Frontend Pre-Deployment Checklist

### Type & Validation
- [ ] TypeScript compiles without errors
- [ ] `types/user.d.ts` is properly exported
- [ ] `utils/validators.ts` has all 5 functions: validateEmail, validatePhoneNumber, validateUsername, validatePassword, normalizePhoneNumber
- [ ] Phone validation correctly accepts 9-15 digits (no special formatting required on frontend)

### Store
- [ ] `useAuthStore` has `pendingGoogleAuth` state
- [ ] `setPendingGoogleAuth()` method exists
- [ ] `isPhoneComplete()` method returns correct value
- [ ] `clearSession()` clears both session and pending state
- [ ] `hydrate()` never restores pending auth

### API
- [ ] `googleSignIn(payload)` function exists in `services/api/auth/index.ts`
- [ ] `completePhoneNumber(payload)` function exists
- [ ] Both have proper TypeScript types defined
- [ ] Request types: `GoogleAuthPayload`, `CompletePhonePayload`
- [ ] Response types: `GoogleAuthResponseFull`, `GoogleAuthResponsePending`
- [ ] Union type: `GoogleAuthResponse` covers both cases

### Client Interceptor
- [ ] Request interceptor checks for `/complete-phone` endpoint
- [ ] Uses pending token for phone completion requests
- [ ] Uses normal token for other requests
- [ ] Response interceptor doesn't retry 401 on phone completion (appropriate error handling)

### Login Screen
- [ ] Google handler imports and uses `googleSignIn()` from service
- [ ] Branches on `res.status === "completed"` vs `res.status === "requiresPhone"`
- [ ] On completed: calls `setSession()` and navigates to `/(tabs)/index`
- [ ] On requiresPhone: calls `setPendingGoogleAuth()` and navigates to `/(auth)/complete-phone`
- [ ] Email/password login still works (unchanged logic)

### Phone Completion Screen
- [ ] Screen file exists at `app/(auth)/complete-phone.tsx`
- [ ] Shows pending Google email (read-only)
- [ ] Phone input with validation
- [ ] "Complete sign up" button calls `completePhoneNumber()`
- [ ] Shows error for duplicate phone (409)
- [ ] Shows error for expired token (401) + redirects to login
- [ ] "Start over" button clears session and redirects to login

### Register Screen
- [ ] Imports validators from `@/utils/validators`
- [ ] Uses `validatePhoneNumber()`, `validateUsername()`, `validatePassword()`, `validateEmail()`
- [ ] No inline validation functions (all shared)
- [ ] Registration still requires phone (unchanged)

### New Hook
- [ ] `usePhoneComplete()` hook exists in `hooks/usePhoneComplete.ts`
- [ ] Exports `isPhoneComplete()` function
- [ ] Exports `checkPhoneComplete(callback)` function
- [ ] Correctly redirects to login/phone completion when needed

---

## Testing: Login Flows

### Test 1: Email/Password Login
```
1. Go to Login screen
2. Enter username and password
3. Tap "Sign in"
4. Should navigate to home (/(tabs)/index)
5. User should be fully authenticated
```

### Test 2: Google Login (No Phone)
```
1. Go to Login screen
2. Tap "Continue with Google"
3. Complete Google sign-in
4. Redirected to Phone Completion screen
5. Email should be shown (read-only)
6. Enter valid phone (e.g., 1234567890)
7. Tap "Complete sign up"
8. Should navigate to home (/(tabs)/index)
9. User should be fully authenticated
```

### Test 3: Google Login (With Phone - if testing with existing backend)
```
1. Google account that already has phone on backend
2. Tap "Continue with Google"
3. Should navigate directly to home (skip phone screen)
4. User should be fully authenticated
```

### Test 4: Duplicate Phone During Completion
```
1. New Google user → phone completion screen
2. Enter phone number that already exists
3. Should show error: "Phone number already registered"
4. Allow retry with different phone
5. Enter new phone
6. Should succeed
```

### Test 5: App Restart Loses Pending Auth
```
1. Google login → pending auth (on phone screen)
2. Force quit app
3. Reopen app
4. Pending auth should be cleared
5. App should redirect to login or return to last authenticated state
```

### Test 6: Protected Action Without Phone
```
1. Create hook usage on a test screen
2. Google user (pending phone) tries protected action
3. Should redirect to phone completion
4. Complete phone
5. Retry action → should work
```

---

## Backend Ready? Start Here

When backend is ready, the backend developer should:

1. **Read:** [BACKEND_IMPLEMENTATION_GUIDE.md](BACKEND_IMPLEMENTATION_GUIDE.md)
   - Endpoints to implement:
     - `POST /api/auth/google` (two response types)
     - `POST /api/auth/complete-phone` (with pending token auth)
   - Database:
     - Unique index on `phoneNumber`
     - New `onboardingComplete` flag
     - Potential `googleId` field

2. **Implement:**
   - Google idToken verification
   - Two-outcome response (completed vs requiresPhone)
   - Pending token generation (30m TTL)
   - Phone completion endpoint (validates uniqueness)
   - Middleware to check phone requirement on protected routes

3. **Test:**
   - New Google user → [Phone email, pending token]
   - Existing Google user with phone → [Full session immediately]
   - Phone completion with duplicate → [409 error]
   - Phone completion with expired token → [401 error]
   - Protected route without phone → [403 with PHONE_REQUIRED code]

4. **Update Environment:**
   - Ensure `GOOGLE_CLIENT_ID` matches frontend config
   - Set JWT_SECRET, token TTL values
   - Configure MongoDB with phone index

---

## Integration Points

### Frontend → Backend Requests

| Endpoint | Frontend Caller | Expected Backend Response |
|----------|-----------------|--------------------------|
| `POST /api/auth/google` | `login.tsx` → `googleSignIn()` | `{ status: "completed" \| "requiresPhone", data: {...} }` |
| `POST /api/auth/complete-phone` | `complete-phone.tsx` → `completePhoneNumber()` | `{ accessToken, refreshToken, user }` |
| `POST /api/users/login` | `login.tsx` → `loginUser()` | `{ accessToken, refreshToken, user }` (unchanged) |
| `POST /api/users/register` | `register.tsx` → `registerUser()` | Standard register response (unchanged) |
| Protected routes | Any component using `checkPhoneComplete()` | May return 403 with `PHONE_REQUIRED` code |

### Frontend Response Handling

| Response | Frontend Behavior |
|----------|-------------------|
| Google login: `status: "completed"` | Full session → navigate to home |
| Google login: `status: "requiresPhone"` | Store pending → navigate to phone completion |
| Phone completion success | Full session → navigate to home |
| Phone completion 409 (duplicate) | Show error, allow retry |
| Phone completion 401 (expired) | Show error, redirect to login |
| Protected route 403 PHONE_REQUIRED | Redirect to phone completion screen |

---

## Debugging Tips

### Issue: "Pending auth is restored after app restart"
- Check `hydrate()` in store—should only restore full session, never pending state
- Pending state should be ephemeral (not in SecureStore)

### Issue: "Phone completion request sends wrong token"
- Check client.ts request interceptor
- Make sure it reads `pendingGoogleAuth.pendingToken` from store
- Verify `url.includes('/complete-phone')` is correct

### Issue: "Google response type mismatch"
- Ensure `GoogleAuthResponse` union type covers both cases
- Frontend expects `status` field in response, not wrapped in `data`

### Issue: "Phone validation too strict/loose"
- Check `validatePhoneNumber()` in validators.ts
- Current: 9-15 digits (international safe)
- Backend should match this validation

### Issue: "User can access protected routes without phone"
- Check each protected action uses `checkPhoneComplete()` hook
- Backend also validates with `requirePhoneComplete` middleware
- Both layers needed for security

---

## Files Summary by Purpose

### Authentication Flow
- `services/api/auth/index.ts` - API methods
- `store/auth.ts` - State management
- `services/api/client.ts` - HTTP client with token injection

### UI Components
- `app/(auth)/login.tsx` - Email/password + Google login
- `app/(auth)/complete-phone.tsx` - Phone completion screen
- `app/(auth)/register.tsx` - Email/password registration

### Utilities
- `utils/validators.ts` - Validation functions
- `hooks/usePhoneComplete.ts` - Action protection hook
- `types/user.d.ts` - Type definitions

### Documentation
- `BACKEND_IMPLEMENTATION_GUIDE.md` - Backend instructions
- `FRONTEND_IMPLEMENTATION_SUMMARY.md` - Changes overview
- `HOW_TO_PROTECT_ACTIONS.md` - Protection pattern guide

---

## Next Steps

1. **Frontend Testing** (no backend needed):
   - [ ] All TypeScript compiles
   - [ ] Navigation between screens works
   - [ ] Form validation works
   - [ ] Share screens with your team for review

2. **Backend Development**:
   - [ ] Backend developer reads BACKEND_IMPLEMENTATION_GUIDE.md
   - [ ] Implements both Google and phone endpoints
   - [ ] Sets up phone uniqueness index
   - [ ] Tests endpoints with Postman/cURL

3. **Integration Testing**:
   - [ ] Connect frontend to backend
   - [ ] Run through all 6 test scenarios above
   - [ ] Verify error handling (duplicate phone, expired token)
   - [ ] Test app restart behavior

4. **Production Prep**:
   - [ ] Security review (token TTL, validation layers)
   - [ ] Load test phone completion endpoint
   - [ ] Test with real Google OAuth credentials
   - [ ] Setup monitoring for failed phone completions

---

## Support Documents

For your reference:
- **Backend Dev:** Read `BACKEND_IMPLEMENTATION_GUIDE.md` first
- **Frontend Dev:** Check `FRONTEND_IMPLEMENTATION_SUMMARY.md` for all changes
- **Integration:** Use checklist above and test scenarios
- **Features:** See `HOW_TO_PROTECT_ACTIONS.md` for action protection examples

---

## Questions?

Key decisions made:
1. ✅ Phone completion is **mandatory** for Google users
2. ✅ Pending auth is **ephemeral** (not persisted)
3. ✅ Free tabs open to all, only **actions blocked** without phone
4. ✅ Phone **uniqueness enforced** at backend
5. ✅ Error messages **specific** (409 for duplicate, 401 for expired)

All implementation follows these decisions. Backend implementation must match these expectations.
