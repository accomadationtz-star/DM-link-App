# Backend Implementation Guide: Google Login + Phone Completion

## Overview
This document provides complete backend implementation instructions for the two-stage Google authentication flow with mandatory phone completion. The frontend has been updated to support this flow, and the backend must implement the corresponding endpoints and logic.

---

## Architecture Decision
- **Stage 1:** Google OAuth verification → returns either full session OR pending auth token
- **Stage 2:** Phone completion with pending token → returns full session
- **Data Model:** Phone number is unique and required for all users
- **Token Types:** Access/Refresh tokens (full auth) and Pending tokens (temporary, for phone completion only)

---

## Database Schema Updates

### User Model (MongoDB)
```javascript
{
  _id: ObjectId,
  googleId: String, // unique if oauth user, null for email/password
  username: String, // unique
  email: String, // unique
  phoneNumber: String, // unique, required after phone completion
  passwordHash: String, // null for Google-only users / null for oauth users
  role: String, // default: "user"
  onboardingComplete: Boolean, // true only after phone completion for OAuth users
  createdAt: Date,
  updatedAt: Date,
}

// Add unique index on phoneNumber
db.users.createIndex({ phoneNumber: 1 }, { unique: true, sparse: true })
db.users.createIndex({ googleId: 1 }, { unique: true, sparse: true })
```

### Tokens Strategy
- **Access Token:** Standard JWT, 15-30 minutes TTL, contains full user data
- **Refresh Token:** Long-lived JWT, 7-30 days TTL, used to refresh access tokens
- **Pending Token:** Temporary JWT, 30 minutes TTL, contains:
  - `sub`: user ID
  - `type: "pending"`
  - `email`: user email
  - `googleId`: Google user ID
  - **NO phone number, NO role expansion**

---

## Endpoint 1: POST /api/auth/google

### Purpose
Exchange Google idToken for either:
1. Full session (if user already has phone)
2. Pending auth token (if phone is missing)

### Request
```http
POST /api/auth/google
Content-Type: application/json

{
  "idToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response (Status 200)

**Case 1: User has phone (onboarding complete)**
```json
{
  "success": true,
  "status": "completed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com",
      "phoneNumber": "1234567890",
      "role": "user"
    }
  }
}
```

**Case 2: User missing phone (new or incomplete OAuth)**
```json
{
  "success": true,
  "status": "requiresPhone",
  "data": {
    "pendingToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john@example.com",
      "googleId": "105694172..."
    },
    "phoneRequired": true
  }
}
```

### Error Responses
```json
{
  "success": false,
  "message": "Invalid idToken",
  "code": "INVALID_TOKEN"
}
```

### Implementation Logic (Node/Express)

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'idToken is required'
      });
    }

    // Verify Google idToken
    let googleUser;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      googleUser = ticket.getPayload();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired idToken'
      });
    }

    // Extract Google profile data
    const { sub: googleId, email, name } = googleUser;

    // Find or create user by googleId (NOT email, to avoid conflicts with email/password users)
    let user = await User.findOne({ googleId });

    if (!user) {
      // Create new user with Google profile
      user = new User({
        googleId,
        email,
        username: email.split('@')[0] + '_' + Date.now(), // Generate unique username
        // phoneNumber intentionally NOT set (user must complete it)
        role: 'user',
      });
      await user.save();
    }

    // Check if user has completed phone requirement
    if (user.phoneNumber && user.onboardingComplete) {
      // User has phone, issue full session
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      return res.json({
        success: true,
        status: 'completed',
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
          },
        },
      });
    } else {
      // User missing phone, issue pending token
      const pendingToken = generatePendingToken(user);

      return res.json({
        success: true,
        status: 'requiresPhone',
        data: {
          pendingToken,
          user: {
            id: user._id.toString(),
            email: user.email,
            googleId: user.googleId,
          },
          phoneRequired: true,
        },
      });
    }
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
});

// Helper: Generate pending token (30 min TTL)
function generatePendingToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      type: 'pending',
      email: user.email,
      googleId: user.googleId,
    },
    process.env.JWT_SECRET,
    { expiresIn: '30m' }
  );
}

// Helper: Generate access token
function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

// Helper: Generate refresh token
function generateRefreshToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      type: 'refresh',
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}
```

---

## Endpoint 2: POST /api/auth/complete-phone

### Purpose
Complete phone verification for pending Google users. Requires valid pending token in Authorization header.

### Request
```http
POST /api/auth/complete-phone
Authorization: Bearer {pendingToken}
Content-Type: application/json

{
  "phoneNumber": "1234567890"
}
```

### Response (Status 200)
```json
{
  "success": true,
  "message": "Phone number verified",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com",
      "phoneNumber": "1234567890",
      "role": "user"
    }
  }
}
```

### Error Responses

**409 Conflict (Phone already exists)**
```json
{
  "success": false,
  "message": "Phone number already registered",
  "code": "PHONE_DUPLICATE"
}
```

**401 Unauthorized (Invalid/expired pending token)**
```json
{
  "success": false,
  "message": "Session expired, please sign in again"
}
```

**400 Bad Request (Invalid phone)**
```json
{
  "success": false,
  "message": "Phone number must be 9-15 digits"
}
```

### Implementation Logic

```javascript
// Middleware to authenticate pending token
function authorizePendingToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Missing or invalid authorization header'
    });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'pending') {
      throw new Error('Token type mismatch');
    }
    req.auth = decoded; // userId in req.auth.sub
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
  next();
}

router.post('/auth/complete-phone', authorizePendingToken, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const userId = req.auth.sub;

    // Validate phone format
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 15) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be 9-15 digits'
      });
    }

    // Normalize phone (store only digits)
    const normalizedPhone = digits;

    // Check if phone already exists (unique constraint)
    const existingUser = await User.findOne({ phoneNumber: normalizedPhone });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Phone number already registered',
        code: 'PHONE_DUPLICATE'
      });
    }

    // Update user with phone and mark onboarding complete
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.phoneNumber = normalizedPhone;
    user.onboardingComplete = true;
    await user.save();

    // Issue full session tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      message: 'Phone number verified',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
        },
      },
    });
  } catch (err) {
    console.error('Phone completion error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to complete phone verification'
    });
  }
});
```

---

## Endpoint 3: POST /api/users/register (Updated)

### Changes
- Phone number is REQUIRED for email/password registration
- Phone uniqueness validation must be enforced
- Existing endpoint structure remains the same

### Request (No changes to client side)
```http
POST /api/users/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "phoneNumber": "1234567890",
  "password": "securepass123"
}
```

### Changes to Implementation
```javascript
router.post('/users/register', async (req, res) => {
  try {
    const { username, email, phoneNumber, password } = req.body;

    // Validate all fields
    if (!username || !email || !phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate phone format
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 15) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be 9-15 digits'
      });
    }
    const normalizedPhone = digits;

    // Check for duplicates (including phoneNumber now)
    let existingUser = await User.findOne({
      $or: [{ username }, { email }, { phoneNumber: normalizedPhone }]
    });

    if (existingUser) {
      let field = 'username';
      if (existingUser.email === email) field = 'email';
      if (existingUser.phoneNumber === normalizedPhone) field = 'phoneNumber';

      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
        code: 'DUPLICATE_' + field.toUpperCase()
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user with phone (required for email/password users too)
    const user = new User({
      username,
      email,
      phoneNumber: normalizedPhone,
      passwordHash,
      role: 'user',
      onboardingComplete: true, // Email/password users complete phone during registration
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: user._id.toString()
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});
```

---

## Endpoint 4: POST /api/users/login (No Changes)

Login endpoint remains unchanged—users with complete profiles (including phone) can log in normally.

---

## Middleware: Protect Routes Requiring Phone

Create middleware to check if user has completed phone requirement:

```javascript
function requirePhoneComplete(req, res, next) {
  const token = req.headers.authorization?.slice(7);
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check token is not a pending token
    if (decoded.type === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Phone verification required',
        code: 'PHONE_REQUIRED'
      });
    }

    // Check user has phone in token
    if (!decoded.phoneNumber) {
      return res.status(403).json({
        success: false,
        message: 'Phone verification required',
        code: 'PHONE_REQUIRED'
      });
    }

    req.auth = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
}

// Use on protected routes (bookings, inquiries, etc.)
router.post('/api/bookings', requirePhoneComplete, handleBooking);
router.post('/api/inquiries', requirePhoneComplete, handleInquiry);
```

---

## Frontend-Backend Contract Summary

| Scenario | Frontend Flow | Backend Response |
|----------|---------------|------------------|
| New Google user | Sign in → complete phone → home | `/auth/google` returns `status: requiresPhone` |
| Existing Google user with phone | Sign in → direct to home | `/auth/google` returns `status: completed` |
| Phone completion | Submit phone → validates uniqueness | `POST /complete-phone` returns full tokens |
| Email/password registration | Register with phone → login | Phone is required, unique enforced |
| Protected action (booking) | User without phone attempts | API returns 403 with `PHONE_REQUIRED` code |

---

## Testing Checklist

- [ ] New Google user → pending token issued
- [ ] Duplicate phone during completion → 409 response
- [ ] Expired pending token → 401 response
- [ ] Phone completion → full tokens issued
- [ ] Existing Google user with phone → direct full session
- [ ] Protected route without phone → 403 response
- [ ] Email registration with duplicate phone → 409 response
- [ ] Token refresh works after phone completion
- [ ] Logout clears both pending and full sessions

---

## Environment Variables Needed

```env
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
JWT_SECRET=your-secret-key
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
PENDING_TOKEN_EXPIRY=30m
MONGODB_URI=mongodb://...
BCRYPT_ROUNDS=10
```

---

## Summary

The backend implementation adds:
1. **POST /api/auth/google**: Two-outcome OAuth exchange (complete vs requiresPhone)
2. **POST /api/auth/complete-phone**: Pending token validation + phone verification
3. **Updated /api/users/register**: Enforces unique phone for all users
4. **Middleware**: `requirePhoneComplete` protects sensitive routes
5. **Database**: Unique index on `phoneNumber`, new `onboardingComplete` flag

The flow keeps free browsing open while protecting only phone-dependent actions (bookings, inquiries, etc.). All legacy email/password flows remain intact but now enforce unique phone numbers.
