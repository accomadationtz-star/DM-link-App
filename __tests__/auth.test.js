/**
 * Test Suite: Google Authentication & Phone Completion Flow
 * 
 * Tests cover:
 * 1. New Google user (no phone) → returns pending token
 * 2. Existing Google user (with phone) → returns full session
 * 3. Phone completion → validates uniqueness, issues full tokens
 * 4. Error cases → duplicate phone, expired token, invalid token
 */

import request from 'supertest';
import app from '../index.js'; // Your Express app
import User from '../models/User.js';
import { signPendingToken, signAccessToken } from '../utils/jwt.js';

describe('Google Authentication & Phone Completion', () => {
  // Mock Google idToken (in real tests, mock google-auth-library)
  const mockGoogleIdToken = 'mock-google-id-token-123';
  
  beforeAll(async () => {
    // Connect to test database
    // You should have a test DB setup in your package.json
  });

  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
  });

  afterAll(async () => {
    // Clean up and close database connection
  });

  // ============================================================
  // SCENARIO 1: New Google User (No Phone)
  // ============================================================
  describe('POST /api/auth/google - New User Without Phone', () => {
    it('should return pending token when Google user has no phone', async () => {
      // Mock the Google idToken verification
      // Note: You'll need to mock the google-auth-library in your googleAuth controller
      
      const res = await request(app)
        .post('/api/auth/google')
        .send({ idToken: mockGoogleIdToken })
        .expect(200);

      // Verify response structure
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('status', 'requiresPhone');
      expect(res.body.data).toHaveProperty('pendingToken');
      expect(res.body.data.user).toHaveProperty('email');
      expect(res.body.data.user).toHaveProperty('googleId');
      
      // Verify NO phone or full user data in response
      expect(res.body.data.user).not.toHaveProperty('phoneNumber');
      expect(res.body.data.user).not.toHaveProperty('role');
      
      // Verify user was created in DB
      const user = await User.findOne({ googleId: res.body.data.user.googleId });
      expect(user).toBeDefined();
      expect(user.phoneNumber).toBeUndefined();
      expect(user.onboardingComplete).toBe(false);
    });

    it('should reject request without idToken', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('idToken');
    });
  });

  // ============================================================
  // SCENARIO 2: Existing Google User (With Phone)
  // ============================================================
  describe('POST /api/auth/google - Existing User With Phone', () => {
    it('should return full session when Google user has phone', async () => {
      // Create a Google user with phone in DB
      const existingUser = await User.create({
        googleId: 'google-123',
        email: 'john@example.com',
        username: 'john_doe',
        phoneNumber: '1234567890',
        authProvider: 'google',
        onboardingComplete: true,
      });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ idToken: mockGoogleIdToken })
        .expect(200);

      // Verify response structure
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('status', 'completed');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      
      // Verify full user data is returned
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user).toHaveProperty('email', 'john@example.com');
      expect(res.body.data.user).toHaveProperty('phoneNumber', '1234567890');
      expect(res.body.data.user).toHaveProperty('role');
      
      // Verify NO pending token
      expect(res.body.data).not.toHaveProperty('pendingToken');
    });
  });

  // ============================================================
  // SCENARIO 3: Phone Completion - Valid Phone
  // ============================================================
  describe('POST /api/auth/complete-phone - Valid Phone', () => {
    it('should complete phone verification and return full tokens', async () => {
      // Create a Google user without phone
      const user = await User.create({
        googleId: 'google-456',
        email: 'jane@example.com',
        username: 'jane_doe',
        authProvider: 'google',
        onboardingComplete: false,
      });

      // Create a pending token for this user
      const pendingToken = signPendingToken({
        sub: user._id.toString(),
        type: 'pending',
        email: user.email,
        googleId: user.googleId,
      });

      const res = await request(app)
        .post('/api/auth/complete-phone')
        .set('Authorization', `Bearer ${pendingToken}`)
        .send({ phoneNumber: '9876543210' })
        .expect(200);

      // Verify response
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      
      // Verify user data
      expect(res.body.data.user).toHaveProperty('phoneNumber', '9876543210');
      expect(res.body.data.user).toHaveProperty('email', 'jane@example.com');

      // Verify user was updated in DB
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.phoneNumber).toBe('9876543210');
      expect(updatedUser.onboardingComplete).toBe(true);
    });

    it('should handle phone number with formatting', async () => {
      // Test that phone like "+1 (987) 654-3210" is normalized to "19876543210"
      const user = await User.create({
        googleId: 'google-789',
        email: 'bob@example.com',
        username: 'bob_smith',
        authProvider: 'google',
      });

      const pendingToken = signPendingToken({
        sub: user._id.toString(),
        type: 'pending',
        email: user.email,
        googleId: user.googleId,
      });

      const res = await request(app)
        .post('/api/auth/complete-phone')
        .set('Authorization', `Bearer ${pendingToken}`)
        .send({ phoneNumber: '+1 (234) 567-8900' })
        .expect(200);

      // Should normalize to digits only
      expect(res.body.data.user.phoneNumber).toBe('12345678900');
    });
  });

  // ============================================================
  // SCENARIO 4: Phone Completion - Duplicate Phone
  // ============================================================
  describe('POST /api/auth/complete-phone - Duplicate Phone', () => {
    it('should return 409 when phone already exists', async () => {
      // Create first user with phone
      await User.create({
        username: 'user1',
        email: 'user1@example.com',
        phoneNumber: '1111111111',
        authProvider: 'local',
      });

      // Create second Google user without phone
      const user2 = await User.create({
        googleId: 'google-999',
        email: 'user2@example.com',
        username: 'user2',
        authProvider: 'google',
      });

      const pendingToken = signPendingToken({
        sub: user2._id.toString(),
        type: 'pending',
        email: user2.email,
        googleId: user2.googleId,
      });

      const res = await request(app)
        .post('/api/auth/complete-phone')
        .set('Authorization', `Bearer ${pendingToken}`)
        .send({ phoneNumber: '1111111111' })
        .expect(409);

      // Verify error response
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('code', 'PHONE_DUPLICATE');
      expect(res.body.message).toContain('already');
    });
  });

  // ============================================================
  // SCENARIO 5: Phone Completion - Expired Token
  // ============================================================
  describe('POST /api/auth/complete-phone - Expired Token', () => {
    it('should return 401 with expired pending token', async () => {
      // Create an expired pending token
      const expiredToken = signPendingToken(
        {
          sub: 'user-id',
          type: 'pending',
          email: 'test@example.com',
          googleId: 'google-123',
        },
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const res = await request(app)
        .post('/api/auth/complete-phone')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({ phoneNumber: '1234567890' })
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body.code).toMatch(/EXPIRED|INVALID/);
    });

    it('should return 401 without Authorization header', async () => {
      const res = await request(app)
        .post('/api/auth/complete-phone')
        .send({ phoneNumber: '1234567890' })
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('Authorization');
    });

    it('should return 401 with non-pending token', async () => {
      // Try to use an access token instead of pending token
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        phoneNumber: '1234567890',
        authProvider: 'local',
      });

      const accessToken = signAccessToken(user);

      const res = await request(app)
        .post('/api/auth/complete-phone')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ phoneNumber: '9999999999' })
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('pending');
    });
  });

  // ============================================================
  // SCENARIO 6: Phone Completion - Invalid Phone Format
  // ============================================================
  describe('POST /api/auth/complete-phone - Invalid Phone', () => {
    it('should return 400 for phone with less than 9 digits', async () => {
      const user = await User.create({
        googleId: 'google-111',
        email: 'test@example.com',
        username: 'testuser',
        authProvider: 'google',
      });

      const pendingToken = signPendingToken({
        sub: user._id.toString(),
        type: 'pending',
        email: user.email,
        googleId: user.googleId,
      });

      const res = await request(app)
        .post('/api/auth/complete-phone')
        .set('Authorization', `Bearer ${pendingToken}`)
        .send({ phoneNumber: '12345' })
        .expect(400);

      expect(res.body.code).toBe('INVALID_PHONE');
    });

    it('should return 400 for phone with more than 15 digits', async () => {
      const user = await User.create({
        googleId: 'google-222',
        email: 'test2@example.com',
        username: 'testuser2',
        authProvider: 'google',
      });

      const pendingToken = signPendingToken({
        sub: user._id.toString(),
        type: 'pending',
        email: user.email,
        googleId: user.googleId,
      });

      const res = await request(app)
        .post('/api/auth/complete-phone')
        .set('Authorization', `Bearer ${pendingToken}`)
        .send({ phoneNumber: '12345678901234567' })
        .expect(400);

      expect(res.body.code).toBe('INVALID_PHONE');
    });

    it('should return 400 when phoneNumber field is missing', async () => {
      const user = await User.create({
        googleId: 'google-333',
        email: 'test3@example.com',
        username: 'testuser3',
        authProvider: 'google',
      });

      const pendingToken = signPendingToken({
        sub: user._id.toString(),
        type: 'pending',
        email: user.email,
        googleId: user.googleId,
      });

      const res = await request(app)
        .post('/api/auth/complete-phone')
        .set('Authorization', `Bearer ${pendingToken}`)
        .send({})
        .expect(400);

      expect(res.body.message).toContain('phoneNumber');
    });
  });

  // ============================================================
  // SCENARIO 7: Registration Still Works with Phone Requirement
  // ============================================================
  describe('POST /api/users/register - Phone Now Required', () => {
    it('should require phone number in registration', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'Password123!',
          // phoneNumber missing
        })
        .expect(400);

      expect(res.body.message).toContain('phoneNumber');
    });

    it('should reject duplicate phone during registration', async () => {
      // Create first user
      await User.create({
        username: 'user1',
        email: 'user1@example.com',
        phoneNumber: '5555555555',
        authProvider: 'local',
      });

      // Try to register second user with same phone
      const res = await request(app)
        .post('/api/users/register')
        .send({
          username: 'user2',
          email: 'user2@example.com',
          phoneNumber: '5555555555',
          password: 'Password123!',
        })
        .expect(409);

      expect(res.body.code).toBe('PHONE_DUPLICATE');
    });

    it('should successfully register with phone', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          phoneNumber: '7777777777',
          password: 'Password123!',
        })
        .expect(201);

      expect(res.body.success).toBe(true);

      // Verify user was created with onboardingComplete=true
      const user = await User.findOne({ email: 'newuser@example.com' });
      expect(user.phoneNumber).toBe('7777777777');
      expect(user.onboardingComplete).toBe(true);
    });
  });

  // ============================================================
  // SCENARIO 8: Access Token Contains Phone (for middleware checks)
  // ============================================================
  describe('Access Token Validation', () => {
    it('should include phoneNumber in access token', async () => {
      // Register user
      const registerRes = await request(app)
        .post('/api/users/register')
        .send({
          username: 'tokentest',
          email: 'tokentest@example.com',
          phoneNumber: '8888888888',
          password: 'Password123!',
        });

      // Login
      const loginRes = await request(app)
        .post('/api/users/login')
        .send({
          username: 'tokentest',
          password: 'Password123!',
        })
        .expect(200);

      const accessToken = loginRes.body.data.accessToken;

      // Decode token (without verification, just to inspect)
      const parts = accessToken.split('.');
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );

      // Verify phoneNumber is in payload
      expect(payload).toHaveProperty('phoneNumber', '8888888888');
    });
  });
});
