# Property Edit Implementation - Complete Guide

## ✅ Frontend Implementation Complete

### What Was Done:

1. **Created Unified Property Detail/Edit Screen** (`/app/property/details.tsx`)
   - Single screen for viewing property details with owner identification
   - Toggle between view and edit modes seamlessly
   - Professional UI with theme support (light/dark mode)
   - Responsive design with proper spacing and typography

2. **Added Edit API Function**
   - `updateProperty()` in `/services/api/property/index.ts`
   - PATCH request to `/api/properties/:id`
   - Accepts: title, description, price, bedrooms, area

3. **Updated Navigation**
   - Modified `/app/agent/manage-properties.tsx` to route to `/property/details?id={id}`
   - Added `details` route to `/app/property/_layout.tsx`

4. **Screen Features:**
   - ✅ View mode: Display property info with beautiful cards
   - ✅ Edit mode: Form to update title, description, price, bedrooms, area
   - ✅ Owner detection: Only shows edit button if user is property owner
   - ✅ Inquiry counter display
   - ✅ Location information with icon
   - ✅ Property status badge (color-coded)
   - ✅ Agent/Owner information card
   - ✅ Timestamps (created/updated)
   - ✅ Type and Purpose as read-only fields (cannot be edited)

---

## 🔧 BACKEND IMPLEMENTATION REQUIRED

### 1. Add/Update Property Update Endpoint

Create a new PATCH route or modify existing:

```javascript
// routes/property.js (or your property routes file)

// Update property details (title, description, price, bedrooms, area)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const propertyId = req.params.id;
    const userId = req.user.id;

    // Find property first
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    // Check if user is the owner
    if (property.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own properties',
      });
    }

    // White-list allowed fields for update
    const allowedFields = ['title', 'description', 'price', 'bedrooms', 'area'];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Validate required fields
    if (updateData.title === '') {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      });
    }

    if (updateData.price !== undefined && updateData.price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price cannot be negative',
      });
    }

    if (updateData.bedrooms !== undefined && updateData.bedrooms < 0) {
      return res.status(400).json({
        success: false,
        message: 'Bedrooms cannot be negative',
      });
    }

    if (updateData.area !== undefined && updateData.area <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Area must be greater than 0',
      });
    }

    // Update the property
    const updatedProperty = await Property.findByIdAndUpdate(
      propertyId,
      updateData,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      data: updatedProperty,
    });
  } catch (error) {
    console.error('Error updating property:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating property',
      error: error.message,
    });
  }
});
```

### 2. Ensure GET endpoint returns `inquiryCount`

Your existing endpoints should already work since `inquiryCount` is a normal schema field:

```javascript
// These routes are already correct - no changes needed if using standard Mongoose queries
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: property,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching property',
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    
    const properties = await Property.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Property.countDocuments();
    
    res.status(200).json({
      success: true,
      data: properties,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching properties',
    });
  }
});
```

### 3. Ensure Inquiry Creation Increments Counter

Verify your `createInquiry` endpoint increments `inquiryCount`:

```javascript
// In your inquiries controller
const inquiry = await Inquiry.create({
  // ... inquiry fields ...
});

// ✅ IMPORTANT: Increment property inquiry count
await Property.findByIdAndUpdate(
  propertyId,
  { $inc: { inquiryCount: 1 } },
  { new: true }
);

res.status(201).json({
  success: true,
  message: 'Inquiry created successfully',
  data: inquiry,
});
```

### 4. Property Schema Verification

Ensure your Property schema has:

```javascript
const propertySchema = new mongoose.Schema({
  // ... existing fields ...
  
  inquiryCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  
  // ... rest of fields ...
}, { timestamps: true });
```

---

## 📋 Implementation Checklist

### Backend Tasks:
- [ ] Add PATCH `/api/properties/:id` route for updating properties
- [ ] Verify GET endpoints return `inquiryCount` field
- [ ] Ensure `createInquiry` increments `inquiryCount`
- [ ] Test property updates with different user roles
- [ ] Add validation for all editable fields
- [ ] Test authorization (only owner can edit)

### Testing:
```bash
# Test update property
curl -X PATCH http://localhost:5000/api/properties/{id} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "description": "Updated description",
    "price": 5000000,
    "bedrooms": 3,
    "area": 250
  }'

# Expected Response:
{
  "success": true,
  "message": "Property updated successfully",
  "data": {
    "_id": "...",
    "title": "Updated Title",
    "description": "Updated description",
    "price": 5000000,
    "bedrooms": 3,
    "area": 250,
    "inquiryCount": 2,
    // ... other fields ...
  }
}
```

---

## 🎯 Feature Summary

### Property Detail/Edit Screen:
1. **View Mode:**
   - Professional card layout with all property details
   - Color-coded status badge (Available=Green, Booked=Amber, Sold=Red, Rented=Purple)
   - Grid of detail cards (price, bedrooms, area, type, purpose, inquiries)
   - Location with icon
   - Full description
   - Agent information with avatar
   - Created and updated timestamps

2. **Edit Mode:**
   - Form fields for: title, description, price, bedrooms, area
   - Read-only fields: type, purpose (cannot be changed)
   - Input validation
   - Save and Cancel buttons
   - Loading indicator during save
   - Automatic refresh after successful update

3. **Owner Protection:**
   - Only property owner can see edit button
   - Only property owner can edit
   - Backend enforces authorization

---

## 🚀 How It Works:

1. **Agent Clicks "Edit Property"** in manage-properties screen
   - Routes to `/property/details?id={propertyId}`

2. **Screen Loads Property Data**
   - Fetches property details via API
   - Checks if current user is property owner

3. **User Sees View Mode**
   - Property details displayed beautifully
   - Edit button visible (if owner)

4. **User Clicks Edit Button**
   - Toggles to edit mode
   - Shows form with current values
   - Fields can be edited

5. **User Saves Changes**
   - Validates form data
   - Sends PATCH request to `/api/properties/{id}`
   - Shows success message
   - Refreshes data and returns to view mode

---

## ✨ Design Features:

- ✅ Responsive grid layout (2-column detail cards on larger screens)
- ✅ Theme support (light/dark mode)
- ✅ Smooth transitions and animations
- ✅ Proper spacing and typography
- ✅ Color-coded status indicators
- ✅ Loading states
- ✅ Error handling and user feedback
- ✅ Proper keyboard handling
- ✅ Avatar for agent with initials
- ✅ Professional color scheme matching app branding

---

## 📱 Navigation Flow:

```
Manage Properties Screen
        ↓
    [Edit Button]
        ↓
Property Details/Edit Screen
        ↓
   [Edit Button]
        ↓
Edit Mode
        ↓
[Save Changes]
        ↓
Success Message → Back to View Mode
```

---

## 🔐 Security Notes:

- ✅ Frontend checks owner before showing edit button
- ✅ Backend enforces authorization on PATCH endpoint
- ✅ Only white-listed fields can be updated (title, description, price, bedrooms, area)
- ✅ Type and purpose cannot be edited (immutable after creation)
- ✅ Status changes only through dedicated status endpoint
