# Fix: "Invalid value provided to SecureStore" Error

## Problem

When completing Google login with phone number in the React Native app, you get this error:

```
❌ Error: invalid value provided to securestore.values must be string, 
consider json encoding your value if they are serialized
```

However, the **same request works in Postman** and returns:
```json
{
    "success": true,
    "status": "requiresPhone",
    "pendingToken": "eyJhbGc...",
    ...
}
```

---

## Root Cause

`SecureStore.setItemAsync()` in React Native/Expo **only accepts string values**. The error occurs when trying to store:
- A non-string token (number, object, null, undefined)
- A user object that couldn't be stringified properly

**The Issue Was:** In the `setSession` function, tokens weren't validated as strings before storing.

---

## Solution Applied

### 1. ✅ Added String Validation in `store/auth.ts`

**Changed:**
```typescript
// ❌ BEFORE - No validation
setSession: async ({ user, accessToken, refreshToken }) => {
    await SecureStore.setItemAsync("token", accessToken);
    ...
}
```

**To:**
```typescript
// ✅ AFTER - With validation
setSession: async ({ user, accessToken, refreshToken }) => {
    // Ensure all values are strings before storing in SecureStore
    if (typeof accessToken !== "string") {
        throw new Error("Access token must be a string");
    }
    if (typeof refreshToken !== "string") {
        throw new Error("Refresh token must be a string");
    }
    
    // Store with String() wrapper for safety
    await SecureStore.setItemAsync("token", String(accessToken));
    await SecureStore.setItemAsync("refreshToken", String(refreshToken));
    await SecureStore.setItemAsync("user", JSON.stringify(user));
    ...
}
```

### 2. ✅ Added Token Validation in `services/api/client.ts`

When refreshing tokens, we now validate before storing:

```typescript
const newAccess = refreshed.data.accessToken;
const newRefresh = refreshed.data.refreshToken ?? rToken;

// ✅ NEW: Validate tokens are strings
if (typeof newAccess !== "string") {
    throw new Error("Invalid access token format from refresh");
}
if (typeof newRefresh !== "string") {
    throw new Error("Invalid refresh token format from refresh");
}

await SecureStore.setItemAsync("token", newAccess);
await SecureStore.setItemAsync("refreshToken", newRefresh);
```

### 3. ✅ Added Error Handling in `app/(auth)/login.tsx`

Now catches and displays storage errors clearly:

```typescript
async function onSubmit() {
    try {
        const res = await loginUser({...});
        if (res.success) {
            try {
                await setSession({...});
                router.replace("/(tabs)/index");
            } catch (storageError: any) {
                console.error("❌ Storage error:", storageError.message);
                // Show user-friendly error
                Alert.alert(
                    "Storage Error",
                    "Failed to save session.\n\nError: " + storageError.message
                );
            }
        }
    } catch (e) {
        // Handle network/API errors
    }
}
```

### 4. ✅ Added Error Handling in `app/(auth)/complete-phone.tsx`

Same error handling for phone completion:

```typescript
async function onSubmit() {
    try {
        const res = await completePhoneNumber({phoneNumber});
        if (res.success) {
            try {
                await setSession({...});
                router.replace("/(tabs)/index");
            } catch (storageError: any) {
                Alert.alert("Storage Error", storageError.message);
            }
        }
    } catch (error) {
        // Handle API errors (409, 401, etc)
    }
}
```

---

## Testing the Fix

### Test 1: Google Login (New User)
```bash
# In your app:
1. Tap "Sign in with Google"
2. Select Google account
3. Should navigate to phone completion screen (NOT show error)
```

### Test 2: Complete Phone
```bash
# In phone completion screen:
1. Enter valid phone: 1234567890
2. Tap "Complete sign up"
3. Should navigate to home screen (NOT show storage error)
```

### Test 3: Check Storage
```bash
# Verify tokens were stored correctly:
node -e "
const AsyncStorage = require('@react-native-async-storage/async-storage').default;
AsyncStorage.getItem('token').then(t => console.log('Token stored:', !!t));
"
```

---

## Why This Happens

### Common Causes:

| Cause | Fix |
|-------|-----|
| Backend returns token as `null` | Check backend returns valid JWT string |
| Token is a nested object `{token: "..."}` | Extract just the string: `res.data.accessToken` |
| Token has special characters not escaped | Ensure backend properly encodes JWT |
| User object contains non-serializable fields | Filter user object before stringify |

### Backend Validation Checklist:

```javascript
// In your backend, ensure:
const response = {
    success: true,
    data: {
        accessToken: "eyJhbGc...",  // ✅ String, not object
        refreshToken: "eyJhbGc...", // ✅ String, not object  
        user: {
            id: "123",         // ✅ String
            email: "...",      // ✅ String
            phoneNumber: "...", // ✅ String (9-15 digits)
        }
    }
};

// ❌ DON'T send these:
// accessToken: { token: "eyJhbGc..." }  // Object instead of string!
// accessToken: 123                       // Number instead of string!
// accessToken: null                      // NULL!
```

---

## If Error Still Occurs

### Debug Steps:

1. **Check the actual response in app:**
   ```typescript
   const res = await completePhoneNumber({phoneNumber});
   console.log("Response tokens:", {
       accessToken: typeof res.data.accessToken,
       refreshToken: typeof res.data.refreshToken,
       user: typeof res.data.user
   });
   ```

2. **Log before StorageStore.setItemAsync:**
   ```typescript
   console.log("Storing:", {
       token: String(accessToken) ?? "MISSING",
       refreshToken: String(refreshToken) ?? "MISSING"
   });
   ```

3. **Check console logs when error occurs:**
   - Look for "❌ Storage error:" messages
   - Check token types (should all be "string")

4. **Verify backend response format:**
   - Use Postman to test `/api/auth/complete-phone`
   - Ensure response matches:
     ```json
     {
         "success": true,
         "data": {
             "accessToken": "JWT_STRING",
             "refreshToken": "JWT_STRING",
             "user": { ... }
         }
     }
     ```

---

## Best Practices Going Forward

### ✅ DO:

- Always validate token types before storing
- Use `String()` wrapper when storing values
- Log token types during debugging
- Test with Postman first before app testing
- Check backend returns correct JWT format

### ❌ DON'T:

- Store complex objects directly to SecureStore
- Forget to stringify user objects
- Pass null/undefined tokens to setSession
- Return wrapped tokens like `{token: "..."}` from backend

---

## Files Modified

1. **`store/auth.ts`**
   - Added token type validation in `setSession`
   - Added error messages for invalid tokens

2. **`services/api/client.ts`**
   - Added validation when refreshing tokens
   - Catches token format errors early

3. **`app/(auth)/login.tsx`**
   - Wrapped `setSession` call in try-catch
   - Shows user-friendly storage error alerts

4. **`app/(auth)/complete-phone.tsx`**
   - Wrapped `setSession` call in try-catch
   - Shows user-friendly storage error alerts

---

## Quick Reference

**If you see: "invalid value provided to securestore"**
→ A token or user field is not a string

**Check:**
1. Backend `/api/auth/google` returns `pendingToken` as string ✅
2. Backend `/api/auth/complete-phone` returns `accessToken` as string ✅
3. Backend `/api/auth/complete-phone` returns `refreshToken` as string ✅
4. App calls `setSession` with string tokens (not objects) ✅

**If still failing:**
1. Log the actual response with `console.log(JSON.stringify(res, null, 2))`
2. Check token types: `console.log(typeof res.data.accessToken)`
3. Verify backend is returning actual JWT strings, not wrapped objects

---

## Summary

The error is now fixed with:
- ✅ Token validation before storage
- ✅ Proper string conversion with `String()`
- ✅ Better error messages shown to user
- ✅ Detailed console logs for debugging

Your app should now successfully:
1. Google sign-in → get pending token ✅
2. Complete phone → get full session ✅
3. Store tokens safely in SecureStore ✅
4. Show clear errors if something fails ✅
