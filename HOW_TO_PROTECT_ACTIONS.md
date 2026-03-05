# How to Protect Actions with Phone Check

This guide shows how to use the `usePhoneComplete` hook to guard protected actions in your app. These actions should require the user to have completed phone verification:
- Making booking inquiries
- Creating property listings
- Contacting agents
- Messaging users

---

## Basic Pattern

```typescript
import { usePhoneComplete } from "@/hooks/usePhoneComplete";

export function MyProtectedComponent() {
  const { checkPhoneComplete } = usePhoneComplete();

  const handleProtectedAction = () => {
    // This callback only runs if user has completed phone
    checkPhoneComplete(() => {
      // Safe to call protected API here
      submitBooking();
      // or
      postInquiry();
      // etc.
    });
  };

  return (
    <TouchableOpacity onPress={handleProtectedAction}>
      <Text>Make Booking</Text>
    </TouchableOpacity>
  );
}
```

---

## Real-World Examples

### Example 1: Property Details - Make Booking

**File:** `app/property/[id].tsx`

```typescript
import { usePhoneComplete } from "@/hooks/usePhoneComplete";

export default function PropertyDetailsScreen() {
  const router = useRouter();
  const { checkPhoneComplete } = usePhoneComplete();

  const handleMakeInquiry = async () => {
    // Guard: Check if phone is complete
    const canProceed = checkPhoneComplete(() => {
      // If yes, proceed with inquiry
      submitInquiry();
    });
    
    // If no, checkPhoneComplete already redirected user
    // (to phone completion or login screen)
  };

  const submitInquiry = async () => {
    try {
      // Backend will also validate phone requirement
      // (extra security layer)
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: id,
          message: 'I am interested in this property',
        }),
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Inquiry sent');
        router.back();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send inquiry');
    }
  };

  return (
    <View>
      <Text>Property Details</Text>
      <TouchableOpacity onPress={handleMakeInquiry}>
        <Text>Make an Inquiry</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

### Example 2: Property Management - List Property

**File:** `app/property/upload.tsx`

```typescript
import { usePhoneComplete } from "@/hooks/usePhoneComplete";

export default function UploadPropertyScreen() {
  const router = useRouter();
  const { checkPhoneComplete } = usePhoneComplete();
  const [form, setForm] = useState({...});

  const handlePublish = () => {
    // Validate form first
    if (!validateForm()) return;

    // Then check phone
    checkPhoneComplete(async () => {
      // Phone is complete, safe to publish
      try {
        const response = await fetch('/api/properties', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          Alert.alert('Success', 'Property listed');
          router.replace('/(tabs)/agent');
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to list property');
      }
    });
  };

  return (
    <View>
      {/* Form inputs */}
      <TouchableOpacity onPress={handlePublish}>
        <Text>Publish Property</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

### Example 3: Agent Profile - Send Message

**File:** `app/agent/[id].tsx`

```typescript
import { usePhoneComplete } from "@/hooks/usePhoneComplete";

export default function AgentProfileScreen() {
  const { checkPhoneComplete } = usePhoneComplete();
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (!message.trim()) return;

    checkPhoneComplete(async () => {
      // Phone verified, send message
      try {
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId,
            message,
          }),
        });
        setMessage('');
        Alert.alert('Success', 'Message sent');
      } catch (err) {
        Alert.alert('Error', 'Failed to send message');
      }
    });
  };

  return (
    <View>
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="Message agent..."
      />
      <TouchableOpacity onPress={handleSendMessage}>
        <Text>Send</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

### Example 4: Check Before Navigation

Sometimes you might want to check phone before navigating to a screen:

```typescript
import { usePhoneComplete } from "@/hooks/usePhoneComplete";

const { checkPhoneComplete } = usePhoneComplete();

// Option A: Inline guard
<TouchableOpacity
  onPress={() => {
    checkPhoneComplete(() => {
      router.push('/booking-checkout');
    });
  }}
>
  <Text>Proceed to Checkout</Text>
</TouchableOpacity>

// Option B: Helper function
const navigateToCheckout = () => {
  checkPhoneComplete(() => {
    router.push('/booking-checkout');
  });
};

<TouchableOpacity onPress={navigateToCheckout}>
  <Text>Proceed to Checkout</Text>
</TouchableOpacity>
```

---

## Advanced: Conditional UI

Sometimes you want to show different UI based on phone status:

```typescript
import { usePhoneComplete } from "@/hooks/usePhoneComplete";

export function BookingButton() {
  const { isPhoneComplete, checkPhoneComplete } = usePhoneComplete();

  if (!isPhoneComplete()) {
    return (
      <View style={styles.grayedOut}>
        <Text style={styles.disabledText}>Phone verification required</Text>
        <Text style={styles.hint}>
          Complete your phone number to make bookings
        </Text>
        <TouchableOpacity
          onPress={() => checkPhoneComplete()}
          style={styles.verifyButton}
        >
          <Text>Complete Phone</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.activeButton}
      onPress={() => {
        checkPhoneComplete(() => {
          submitBooking();
        });
      }}
    >
      <Text>Make Booking</Text>
    </TouchableOpacity>
  );
}
```

---

## Hook Implementation Details

### What checkPhoneComplete() Does

```typescript
checkPhoneComplete(onComplete?: () => void): boolean
```

**Returns:** `true` if phone is complete (callback or default true), `false` if redirected

**Behavior:**
1. If user has full session with phone:
   - Runs callback (if provided)
   - Returns `true`
2. If user has pending Google auth:
   - Redirects to `/(auth)/complete-phone`
   - Returns `false`
3. If user not logged in:
   - Redirects to `/(auth)/login`
   - Returns `false`

### Use Cases

| Situation | Behavior |
|-----------|----------|
| User has phone | Run callback, proceed |
| Pending Google auth | Redirect to phone screen, don't proceed |
| Not logged in | Redirect to login, don't proceed |
| Callback omitted | Still redirects if needed, useful for pre-navigation checks |

---

## Backend Error Handling

Your backend will also validate phone requirement. Unified error handling:

```typescript
import { usePhoneComplete } from "@/hooks/usePhoneComplete";

const handleBooking = async () => {
  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });

    if (response.status === 403) {
      const error = await response.json();
      if (error.code === 'PHONE_REQUIRED') {
        // Backend says phone is required
        checkPhoneComplete(); // Redirect to phone completion
        return;
      }
    }

    if (!response.ok) {
      throw new Error('Booking failed');
    }

    // Success
    Alert.alert('Booking confirmed');
  } catch (err) {
    Alert.alert('Error', err.message);
  }
};
```

---

## Summary

**To protect an action:**
1. Import `usePhoneComplete` hook
2. Wrap protected logic in `checkPhoneComplete(() => { ... })`
3. User will be redirected if phone is not complete
4. After redirect and phone completion, user can retry the action

**Free actions** (no guard needed):
- Browse home/properties
- View agent profiles
- Read listings

**Protected actions** (need phone check):
- Make booking inquiry
- List property
- Send message
- Edit profile
- Any write/transaction operation

---

## Testing Protected Actions

```typescript
// Test: Try booking without phone
1. New Google user → pending auth
2. Try to book property
3. Redirected to phone completion
4. Complete phone
5. Retry booking → should work

// Test: Try without logging in
1. User logs out
2. Try to book property
3. Redirected to login
4. Log in
5. Retry booking → should work (if logged in user has phone)
```
