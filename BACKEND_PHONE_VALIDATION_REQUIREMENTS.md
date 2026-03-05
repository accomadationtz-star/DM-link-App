# Backend Phone Number Validation Requirements

## Overview
The frontend now validates Tanzanian phone numbers with strict rules. The backend **MUST** apply the same validation to ensure data integrity and consistency.

---

## Validation Rules

### Tanzanian Phone Number Format
- **Length:** Exactly 10 digits
- **Prefix:** Must start with `06` or `07`
- **Examples:**
  - ✅ Valid: `0712345678`, `0622334455`, `0765432109`
  - ❌ Invalid: `712345678` (9 digits), `0812345678` (starts with 08), `06123456789` (11 digits)

### Storage Format
- Store phone numbers as strings with all digits only (no spaces, dashes, or formatting)
- Example: `"0712345678"`

---

## Backend Implementation

### 1. Update Phone Validation Function

Create or update your phone validation utility:

```javascript
// utils/validators.js

/**
 * Validates Tanzanian phone numbers
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateTanzanianPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Must be exactly 10 digits
  if (digits.length !== 10) return false;
  
  // Must start with 06 or 07
  return digits.startsWith('06') || digits.startsWith('07');
}

/**
 * Normalizes phone number to storage format (digits only)
 * @param {string} phone - Phone number to normalize
 * @returns {string} - Normalized phone number
 */
function normalizePhoneNumber(phone) {
  return phone.replace(/\D/g, '');
}

module.exports = {
  validateTanzanianPhoneNumber,
  normalizePhoneNumber
};
```

### 2. Update User Registration Endpoint

**File:** `controllers/userControllers.js`

**Endpoint:** `POST /api/users/register`

```javascript
const { validateTanzanianPhoneNumber, normalizePhoneNumber } = require('../utils/validators');

const registerUser = async (req, res) => {
  const { username, email, phoneNumber, password } = req.body;

  // Validate required fields
  if (!username || !email || !phoneNumber || !password) {
    return res.status(400).json({ 
      success: false,
      message: "All fields are required" 
    });
  }

  // Validate phone number format
  if (!validateTanzanianPhoneNumber(phoneNumber)) {
    return res.status(400).json({
      success: false,
      message: "Phone number must be 10 digits starting with 06 or 07",
      code: "INVALID_PHONE_FORMAT"
    });
  }

  // Normalize phone number before storage
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  try {
    // Check if phone number already exists
    const existingPhone = await User.findOne({ phoneNumber: normalizedPhone });
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "Phone number already registered",
        code: "PHONE_EXISTS"
      });
    }

    // Create user with normalized phone
    const user = await User.create({
      username,
      email,
      phoneNumber: normalizedPhone,
      password,
      authProvider: 'local',
      onboardingComplete: true
    });

    // ... rest of registration logic
  } catch (error) {
    // ... error handling
  }
};
```

### 3. Update Phone Completion Endpoint

**File:** `controllers/userControllers.js`

**Endpoint:** `POST /api/auth/complete-phone`

```javascript
const { validateTanzanianPhoneNumber, normalizePhoneNumber } = require('../utils/validators');

const completePhone = async (req, res) => {
  const { phoneNumber } = req.body;
  const pendingUserId = req.user.userId; // From authorizePendingToken middleware

  // Validate phone number is provided
  if (!phoneNumber) {
    return res.status(400).json({
      success: false,
      message: "Phone number is required"
    });
  }

  // Validate phone number format
  if (!validateTanzanianPhoneNumber(phoneNumber)) {
    return res.status(400).json({
      success: false,
      message: "Phone number must be 10 digits starting with 06 or 07",
      code: "INVALID_PHONE_FORMAT"
    });
  }

  // Normalize phone number
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  try {
    // Check if phone number already exists
    const existingPhone = await User.findOne({ phoneNumber: normalizedPhone });
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "Phone number already registered",
        code: "PHONE_EXISTS"
      });
    }

    // Update user with phone number
    const user = await User.findByIdAndUpdate(
      pendingUserId,
      { 
        phoneNumber: normalizedPhone,
        onboardingComplete: true
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // ... rest of phone completion logic (generate tokens, etc.)
  } catch (error) {
    // ... error handling
  }
};
```

### 4. Update User Model Schema

**File:** `models/User.js`

Add custom validation to the phoneNumber field:

```javascript
const userSchema = new mongoose.Schema({
  // ... other fields
  
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow null/undefined (sparse index handles uniqueness)
        
        // Must be exactly 10 digits
        if (v.length !== 10) return false;
        
        // Must start with 06 or 07
        return v.startsWith('06') || v.startsWith('07');
      },
      message: props => 'Phone number must be 10 digits starting with 06 or 07'
    }
  },
  
  // ... other fields
}, { timestamps: true });
```

---

## Error Response Codes

### 400 - Invalid Phone Format
**When:** Phone number doesn't match Tanzanian format (not 10 digits or doesn't start with 06/07)

```json
{
  "success": false,
  "message": "Phone number must be 10 digits starting with 06 or 07",
  "code": "INVALID_PHONE_FORMAT"
}
```

### 409 - Phone Already Exists
**When:** Phone number is already registered to another user

```json
{
  "success": false,
  "message": "Phone number already registered",
  "code": "PHONE_EXISTS"
}
```

---

## Testing Requirements

### Test Cases to Implement

#### 1. Valid Phone Numbers (Should Pass)
```javascript
// Test valid 07 prefix
'0712345678' → ✅ Accept

// Test valid 06 prefix
'0622334455' → ✅ Accept

// Test with formatting (should normalize)
'071-234-5678' → Normalize to '0712345678' → ✅ Accept
'071 234 5678' → Normalize to '0712345678' → ✅ Accept
```

#### 2. Invalid Phone Numbers (Should Reject)
```javascript
// Too short (9 digits)
'071234567' → ❌ Reject with INVALID_PHONE_FORMAT

// Too long (11 digits)
'07123456789' → ❌ Reject with INVALID_PHONE_FORMAT

// Wrong prefix (08)
'0812345678' → ❌ Reject with INVALID_PHONE_FORMAT

// Wrong prefix (05)
'0512345678' → ❌ Reject with INVALID_PHONE_FORMAT

// Missing leading zero
'712345678' → ❌ Reject with INVALID_PHONE_FORMAT

// Empty string
'' → ❌ Reject with INVALID_PHONE_FORMAT

// Null or undefined
null → ❌ Reject with INVALID_PHONE_FORMAT
```

#### 3. Duplicate Phone Numbers (Should Reject)
```javascript
// User1 registers with '0712345678'
POST /api/users/register
{ phoneNumber: '0712345678' } → ✅ Success

// User2 tries same number
POST /api/users/register
{ phoneNumber: '0712345678' } → ❌ Reject with PHONE_EXISTS (409)

// User2 tries same number with formatting
POST /api/users/register
{ phoneNumber: '071-234-5678' } → ❌ Reject with PHONE_EXISTS (409)
```

### Sample Test Suite (Jest/Mocha)

```javascript
const { validateTanzanianPhoneNumber, normalizePhoneNumber } = require('../utils/validators');

describe('Phone Number Validation', () => {
  describe('validateTanzanianPhoneNumber', () => {
    it('should accept valid 07 prefix numbers', () => {
      expect(validateTanzanianPhoneNumber('0712345678')).toBe(true);
      expect(validateTanzanianPhoneNumber('0798765432')).toBe(true);
    });

    it('should accept valid 06 prefix numbers', () => {
      expect(validateTanzanianPhoneNumber('0612345678')).toBe(true);
      expect(validateTanzanianPhoneNumber('0698765432')).toBe(true);
    });

    it('should accept numbers with formatting and normalize', () => {
      expect(validateTanzanianPhoneNumber('071-234-5678')).toBe(true);
      expect(validateTanzanianPhoneNumber('071 234 5678')).toBe(true);
      expect(validateTanzanianPhoneNumber('(071) 234-5678')).toBe(true);
    });

    it('should reject numbers that are too short', () => {
      expect(validateTanzanianPhoneNumber('071234567')).toBe(false);
      expect(validateTanzanianPhoneNumber('06123456')).toBe(false);
    });

    it('should reject numbers that are too long', () => {
      expect(validateTanzanianPhoneNumber('07123456789')).toBe(false);
      expect(validateTanzanianPhoneNumber('061234567890')).toBe(false);
    });

    it('should reject numbers with wrong prefix', () => {
      expect(validateTanzanianPhoneNumber('0812345678')).toBe(false);
      expect(validateTanzanianPhoneNumber('0512345678')).toBe(false);
      expect(validateTanzanianPhoneNumber('0912345678')).toBe(false);
    });

    it('should reject numbers without leading zero', () => {
      expect(validateTanzanianPhoneNumber('712345678')).toBe(false);
      expect(validateTanzanianPhoneNumber('612345678')).toBe(false);
    });

    it('should reject empty, null, or undefined', () => {
      expect(validateTanzanianPhoneNumber('')).toBe(false);
      expect(validateTanzanianPhoneNumber(null)).toBe(false);
      expect(validateTanzanianPhoneNumber(undefined)).toBe(false);
    });
  });

  describe('normalizePhoneNumber', () => {
    it('should remove all non-digit characters', () => {
      expect(normalizePhoneNumber('071-234-5678')).toBe('0712345678');
      expect(normalizePhoneNumber('071 234 5678')).toBe('0712345678');
      expect(normalizePhoneNumber('(071) 234-5678')).toBe('0712345678');
    });

    it('should keep digits-only numbers unchanged', () => {
      expect(normalizePhoneNumber('0712345678')).toBe('0712345678');
    });
  });
});
```

---

## API Testing with curl

### Valid Phone Number (Should Succeed)
```bash
# Register with valid 07 number
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "phoneNumber": "0712345678",
    "password": "password123"
  }'

# Expected Response:
# {
#   "success": true,
#   "message": "User registered successfully",
#   "data": { ... }
# }
```

### Valid Phone Number with Formatting (Should Succeed)
```bash
# Register with formatted number (should normalize)
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "jane_doe",
    "email": "jane@example.com",
    "phoneNumber": "071-234-5678",
    "password": "password123"
  }'

# Expected Response:
# {
#   "success": true,
#   "message": "User registered successfully",
#   "data": { "user": { "phoneNumber": "0712345678" } }
# }
```

### Invalid Phone - Wrong Prefix (Should Fail)
```bash
# Try to register with 08 prefix
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "invalid_user",
    "email": "invalid@example.com",
    "phoneNumber": "0812345678",
    "password": "password123"
  }'

# Expected Response:
# {
#   "success": false,
#   "message": "Phone number must be 10 digits starting with 06 or 07",
#   "code": "INVALID_PHONE_FORMAT"
# }
```

### Invalid Phone - Too Short (Should Fail)
```bash
# Try with 9 digits
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "short_phone",
    "email": "short@example.com",
    "phoneNumber": "071234567",
    "password": "password123"
  }'

# Expected Response:
# {
#   "success": false,
#   "message": "Phone number must be 10 digits starting with 06 or 07",
#   "code": "INVALID_PHONE_FORMAT"
# }
```

### Duplicate Phone Number (Should Fail)
```bash
# First registration (succeeds)
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user1",
    "email": "user1@example.com",
    "phoneNumber": "0712345678",
    "password": "password123"
  }'

# Second registration with same phone (fails)
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user2",
    "email": "user2@example.com",
    "phoneNumber": "0712345678",
    "password": "password123"
  }'

# Expected Response:
# {
#   "success": false,
#   "message": "Phone number already registered",
#   "code": "PHONE_EXISTS"
# }
```

---

## Database Considerations

### Index on phoneNumber
Ensure the phoneNumber field has a unique, sparse index:

```javascript
// In your User model or migration
userSchema.index({ phoneNumber: 1 }, { unique: true, sparse: true });
```

**Why sparse?**
- Allows multiple users without phone numbers (null values)
- Only enforces uniqueness for non-null values
- Important for Google users before they complete phone number

### Phone Number Normalization
Always normalize phone numbers before:
1. Storing in database
2. Checking for duplicates
3. Querying users by phone

**Example:**
```javascript
const normalizedPhone = normalizePhoneNumber(req.body.phoneNumber);
const existingUser = await User.findOne({ phoneNumber: normalizedPhone });
```

---

## Migration Guide (If Existing Users)

If you already have users with international phone numbers, you'll need to handle migration:

### Option 1: Invalidate Existing Numbers
```javascript
// Mark all non-Tanzanian numbers as invalid
await User.updateMany(
  {
    phoneNumber: { 
      $exists: true, 
      $not: /^(06|07)\d{8}$/ 
    }
  },
  {
    $unset: { phoneNumber: "" },
    $set: { onboardingComplete: false }
  }
);
```

### Option 2: Request Phone Update
```javascript
// Add a flag for users to update their phone
await User.updateMany(
  {
    phoneNumber: { 
      $exists: true, 
      $not: /^(06|07)\d{8}$/ 
    }
  },
  {
    $set: { requiresPhoneUpdate: true }
  }
);
```

---

## Summary Checklist

- [ ] Create `utils/validators.js` with `validateTanzanianPhoneNumber` and `normalizePhoneNumber`
- [ ] Update `registerUser` controller to validate phone format
- [ ] Update `completePhone` controller to validate phone format
- [ ] Add phone validation to User model schema
- [ ] Always normalize phone numbers before storage
- [ ] Always normalize phone numbers before duplicate checks
- [ ] Return proper error codes (`INVALID_PHONE_FORMAT`, `PHONE_EXISTS`)
- [ ] Add unit tests for phone validation
- [ ] Test API endpoints with curl commands
- [ ] Update API documentation with new validation rules
- [ ] Handle existing users (if any) with migration script

---

## Questions or Issues?

If you encounter any issues implementing these requirements:

1. **Frontend validation passing but backend rejecting:** Check that you're normalizing the phone number on backend before validation
2. **Duplicate detection not working:** Ensure you're normalizing before querying the database
3. **Mongoose validation failing:** Make sure the stored phone numbers are already normalized (10 digits, no formatting)

**Frontend Reference:**
- Validation logic: `utils/validators.ts`
- Error messages: Check `complete-phone.tsx` and `register.tsx` for exact user-facing messages
- Normalization: `normalizePhoneNumber()` in `utils/validators.ts`
