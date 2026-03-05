# Manual Testing Guide: Google Auth + Phone Completion

## Quick Start: Test Without Code

Use these curl commands to test endpoints directly. Open your terminal and run them against your backend.

---

## Prerequisites

1. Backend running on `http://localhost:5000` (adjust URL if different)
2. MongoDB running with test data
3. Google OAuth credentials configured in `.env`
4. JWT secret configured in `.env`

---

## Test 1: New Google User (Returns Pending Token)

### What to test:
- Google user with NO phone gets a pending token
- Can use this pending token to complete phone in next step

### Command:
```bash
curl -X POST http://localhost:5000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE4ZTQ5ZDVmZjAwN2Q2ZDY4ZDQ4MWQyMWY3YTUzZTZjZjA5YmM3MDIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI2Njk5OTAzNDExNzMtZmhpbTZ2aDBkbWlsMjNxYWgxMnRmdGxmZWNnaHBzMTkuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI2Njk5OTAzNDExNzMtZmhpbTZ2aDBkbWlsMjNxYWgxMnRmdGxmZWNnaHBzMTkuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDU2OTEuNDcyNjg1MjM0NTY3ODkwMTIzNDU2Nzg5IiwiZW1haWwiOiJqb2huQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiSGpxdzVBVzc5QWdkXzVReU9INHc4dyIsIm5hbWUiOiJKb2huIERvZSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9kZWZhdWx0LXVzZXIiLCJnaXZlbl9uYW1lIjoiSm9obiIsImZhbWlseV9uYW1lIjoiRG9lIiwibG9jYWxlIjoiZW4iLCJpYXQiOjE2NzgwNDgyNDUsImV4cCI6MTY3ODA1MTg0NX0.signature"
  }'
```

### Expected Response (200 OK):
```json
{
  "success": true,
  "status": "requiresPhone",
  "message": "Phone completion required",
  "data": {
    "pendingToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWFlZWY0ZDJjNjVlNDAwMDAwMDAwMDEiLCJ0eXBlIjoicGVuZGluZyIsImVtYWlsIjoiam9obkBnbWFpbC5jb20iLCJnb29nbGVJZCI6IjEwNTY5MTQ3MjY4NTIzNDU2Nzg5IiwiaWF0IjoxNjc4MDQ4MjQ1LCJleHAiOjE2NzgwNDk4NDV9.signature",
    "user": {
      "id": "65aeeef4d2c65e40000000001",
      "email": "john@gmail.com",
      "googleId": "105691472685234567890"
    },
    "phoneRequired": true
  }
}
```

**✅ Good sign:** You got `status: "requiresPhone"` and a `pendingToken`

---

## Test 2: Complete Phone (Using Pending Token)

### What to test:
- Use pending token from Test 1
- Submit valid phone number
- Get full access + refresh tokens

### Command:
```bash
# Replace PENDING_TOKEN with the pendingToken from Test 1
curl -X POST http://localhost:5000/api/auth/complete-phone \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PENDING_TOKEN" \
  -d '{
    "phoneNumber": "1234567890"
  }'
```

### Expected Response (200 OK):
```json
{
  "success": true,
  "message": "Phone number verified",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWFlZWY0ZDJjNjVlNDAwMDAwMDAwMDEiLCJ1c2VybmFtZSI6ImpvaG5fZG9lIiwiZW1haWwiOiJqb2huQGdtYWlsLmNvbSIsInBob25lTnVtYmVyIjoiMTIzNDU2Nzg5MCIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjc4MDQ4MjQ1LCJleHAiOjE2NzgwNDkwNDV9.signature",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWFlZWY0ZDJjNjVlNDAwMDAwMDAwMDEiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTY3ODA0ODI0NSwiZXhwIjoxNjc4NjUzMDQ1fQ.signature",
    "user": {
      "id": "65aeeef4d2c65e40000000001",
      "username": "john_doe",
      "email": "john@gmail.com",
      "phoneNumber": "1234567890",
      "role": "user"
    }
  }
}
```

**✅ Good sign:** Phone is verified, you have full tokens

---

## Test 3: Duplicate Phone (Error Handling)

### What to test:
- Submitting phone that already exists → 409 Conflict

### Setup first:
```bash
# Create first user with phone
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "existing_user",
    "email": "existing@example.com",
    "phoneNumber": "9876543210",
    "password": "Password123!"
  }'
```

### Then test duplicate:
```bash
# Try to use same phone in Google completion
curl -X POST http://localhost:5000/api/auth/complete-phone \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PENDING_TOKEN" \
  -d '{
    "phoneNumber": "9876543210"
  }'
```

### Expected Response (409 Conflict):
```json
{
  "success": false,
  "code": "PHONE_DUPLICATE",
  "message": "Phone number already registered",
  "statusCode": 409
}
```

**✅ Good sign:** Got 409 with PHONE_DUPLICATE code

---

## Test 4: Expired Pending Token (Error Handling)

### What to test:
- Using an expired pending token → 401 Unauthorized

### Note: 
You need to either:
1. Wait 30+ minutes (if token expiry is 30m), OR
2. Manually create expired token in MongoDB

### Manual approach - Create expired token:
```bash
# In MongoDB:
db.users.findOneAndUpdate(
  { email: "john@example.com" },
  { $set: { expiredPendingToken: "manually-expire-this" } }
)
```

### Then test:
```bash
curl -X POST http://localhost:5000/api/auth/complete-phone \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.EXPIRED_TOKEN_PAYLOAD.signature" \
  -d '{
    "phoneNumber": "1111111111"
  }'
```

### Expected Response (401 Unauthorized):
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "code": "PENDING_TOKEN_EXPIRED",
  "statusCode": 401
}
```

**✅ Good sign:** Got 401 with proper error code

---

## Test 5: Missing Authorization Header

### What to test:
- Calling phone completion without pending token → 401

### Command:
```bash
curl -X POST http://localhost:5000/api/auth/complete-phone \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "1234567890"
  }'
```

### Expected Response (401 Unauthorized):
```json
{
  "success": false,
  "message": "Missing or invalid Authorization header",
  "statusCode": 401
}
```

**✅ Good sign:** Rejected without token

---

## Test 6: Invalid Phone Format

### What to test:
- Phone with less than 9 digits → 400 Bad Request
- Phone with more than 15 digits → 400 Bad Request

### Test too short:
```bash
curl -X POST http://localhost:5000/api/auth/complete-phone \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PENDING_TOKEN" \
  -d '{
    "phoneNumber": "123"
  }'
```

### Expected Response (400 Bad Request):
```json
{
  "success": false,
  "code": "INVALID_PHONE",
  "message": "Phone number must be 9-15 digits",
  "statusCode": 400
}
```

### Test too long:
```bash
curl -X POST http://localhost:5000/api/auth/complete-phone \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PENDING_TOKEN" \
  -d '{
    "phoneNumber": "123456789012345678"
  }'
```

**✅ Good sign:** Both rejected with INVALID_PHONE code

---

## Test 7: Registration with Phone (Updated Behavior)

### What to test:
- Registration now REQUIRES phone number
- Phone must be unique
- onboardingComplete set to true for email users

### Register user:
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@example.com",
    "phoneNumber": "3334445555",
    "password": "Password123!"
  }'
```

### Expected Response (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "userId": "65aeeef4d2c65e40000000002"
}
```

### Try duplicate phone:
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "anotheruser",
    "email": "another@example.com",
    "phoneNumber": "3334445555",
    "password": "Password123!"
  }'
```

### Expected Response (409 Conflict):
```json
{
  "success": false,
  "code": "PHONE_DUPLICATE",
  "message": "Phone number already registered",
  "statusCode": 409
}
```

**✅ Good sign:** Phone is required and unique constraint enforced

---

## Test 8: Login Still Works (No Changes)

### What to test:
- Email/password login works as before

### Command:
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "Password123!"
  }'
```

### Expected Response (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "user": {
      "id": "65aeeef4d2c65e40000000002",
      "username": "newuser",
      "email": "newuser@example.com",
      "phoneNumber": "3334445555",
      "role": "user"
    }
  }
}
```

**✅ Good sign:** Login works and includes phone in response

---

## Test 9: Verify Phone in Access Token

### What to test:
- Access token includes phoneNumber (for middleware checks)

### Get access token from login (Test 8), then decode:

```bash
# Extract the access token from login response, then:
node -e "
const token = 'YOUR_ACCESS_TOKEN';
const parts = token.split('.');
const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
console.log(JSON.stringify(payload, null, 2));
"
```

### Expected payload:
```json
{
  "sub": "65aeeef4d2c65e40000000002",
  "username": "newuser",
  "email": "newuser@example.com",
  "phoneNumber": "3334445555",    ← THIS IS IMPORTANT
  "role": "user",
  "iat": 1678048245,
  "exp": 1678051845
}
```

**✅ Good sign:** phoneNumber is in token (middleware can read it)

---

## Test 10: Existing Google User (With Phone)

### What to test:
- Google user that already has phone gets FULL SESSION (no phone screen)

### Setup:
```bash
# Manually insert a Google user with phone in MongoDB:
db.users.insertOne({
  googleId: "999888777",
  email: "existing-google@gmail.com",
  username: "existing_google_user",
  phoneNumber: "6666666666",
  authProvider: "google",
  onboardingComplete: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Test login:
```bash
curl -X POST http://localhost:5000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "GOOGLE_TOKEN_FOR_999888777"
  }'
```

### Expected Response (200 OK):
```json
{
  "success": true,
  "status": "completed",    ← NOT "requiresPhone"
  "message": "Google authentication successful",
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "user": {
      "id": "...",
      "username": "existing_google_user",
      "email": "existing-google@gmail.com",
      "phoneNumber": "6666666666",
      "role": "user"
    }
  }
}
```

**✅ Good sign:** Got `status: "completed"` directly, no pending token

---

## Summary: Test Checklist

Run through these in order:

- [ ] **Test 1** - New Google user → gets pending token
- [ ] **Test 2** - Phone completion → full tokens
- [ ] **Test 3** - Duplicate phone → 409 error
- [ ] **Test 4** - Expired token → 401 error
- [ ] **Test 5** - No token → 401 error
- [ ] **Test 6** - Invalid phone format → 400 error
- [ ] **Test 7** - Registration requires phone, enforces unique
- [ ] **Test 8** - Login still works
- [ ] **Test 9** - Access token contains phone
- [ ] **Test 10** - Existing Google user skips phone screen

---

## Postman Collection Alternative

If you prefer Postman, create requests with these settings:

### Request 1: Google Auth (New User)
```
POST /api/auth/google
Body (raw JSON):
{
  "idToken": "YOUR_GOOGLE_ID_TOKEN"
}
```

### Request 2: Complete Phone
```
POST /api/auth/complete-phone
Headers:
  Authorization: Bearer {{pendingToken}}
Body (raw JSON):
{
  "phoneNumber": "1234567890"
}
```

Use Postman environment variables:
- Save `pendingToken` from Test 1 response to `{{pendingToken}}`
- Save `accessToken` from Test 2 response to `{{accessToken}}`
- Use later tests to verify protected routes

---

## Debugging Tips

If tests fail:

1. **Check MongoDB is running:**
   ```bash
   mongo --version
   ```

2. **Check backend is running:**
   ```bash
   curl http://localhost:5000/health
   ```

3. **Check logs for errors:**
   ```bash
   # Your stderr should show JWT verification, DB queries, etc.
   ```

4. **Verify .env variables:**
   ```bash
   echo $ACCESS_TOKEN_SECRET
   echo $GOOGLE_WEB_CLIENT_ID
   ```

5. **Clear test data:**
   ```bash
   # In MongoDB:
   db.users.deleteMany({ email: { $regex: 'test|example' } })
   ```

---

## Next: Phone Requirement on Protected Routes

After confirming all tests above pass, update protected routes:

```javascript
// In your routes (bookings, inquiries, etc.):
router.post('/api/bookings', requirePhoneComplete, handleBooking);
router.post('/api/inquiries', requirePhoneComplete, handleInquiry);
```

Then test:
```bash
# Try to book with pending token (should fail with 403)
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer {{pendingToken}}" \
  -H "Content-Type: application/json" \
  -d { "propertyId": "123" }

# Expected: 403 with code "PHONE_REQUIRED"
```

---

## Questions?

If any test fails:
1. Check the error code in response
2. Verify the middleware is being called
3. Check database has correct data
4. Review controller logic matches expected response format
5. Verify JWT secret matches between signing and verification

All 10 tests should pass before considering the implementation complete! ✅
