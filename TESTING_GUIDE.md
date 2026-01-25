# Quick Testing Guide

## All features are now live! Here's how to test them:

### 1. Country Code Selectors

**Order Page** (`http://localhost:3001/order`)
- Look for phone number and WhatsApp number fields
- Each should have a dropdown with country flag and code on the left
- Default: 🇮🇳 +91
- Click to change country code
- Type number without country code (the selector handles it)
- Click "Same as phone" to copy mobile number to WhatsApp (including country code)

**Customer Login** (`http://localhost:3001/customer/login`)
- Country code selector before phone input
- Login works with any country code

**Admin Volunteers** (`http://localhost:3001/admin/volunteers/new`)
- Phone field has country code selector
- Same pattern as order form

---

### 2. Live Validation - Volunteer Forms

**Test at:** 
- New: `http://localhost:3001/admin/volunteers/new`
- Edit: `http://localhost:3001/admin/volunteers` → Click edit on any volunteer

**What to test:**
1. Start typing a name → See live error if less than 2 characters
2. Email: Type invalid email → See immediate error
3. Phone: Type less than 10 digits → See error
4. Password: Type less than 8 characters → See error  
5. Try submitting with errors → Form won't submit
6. Fix all errors → Submit button becomes active

**Compared to before:**
- ✅ Errors appear while typing (before: only on submit)
- ✅ Each field shows its own error (before: toast messages only)
- ✅ Visual feedback with red borders
- ✅ Can't submit if there are errors

---

### 3. Location Link Feature

**Test at:** `http://localhost:3001/order`
Scroll to the delivery address section.

**Two ways to add location:**

**Option A: Use Current Location**
1. Click "Use Current Location" button
2. Browser asks for permission → Allow
3. A Google Maps link is generated automatically
4. Click the "Open" icon to verify it points to your location

**Option B: Pick on Map**
1. Click "Pick on Map" button
2. Google Maps opens in new tab
3. Find your delivery location, right-click
4. Select "Share" or "Copy link"
5. Paste the link in the input field
6. Click the "Open" icon to verify

**Note:** This field is **optional** - you can submit the order without it!

---

## Database Migration Required

Before location links work properly, run this in your Supabase SQL Editor:

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS location_link TEXT;
```

Or simply run the migration file at:
`/supabase/migrations/add-location-link.sql`

---

## What Changed from the Old System?

### Phone Numbers
- **Before:** Hardcoded +91 prefix, only Indian numbers
- **Now:** Choose any country code, works internationally

### Validation
- **Before:** Errors shown only after form submission
- **Now:** Live errors as you type, much better UX

### Location
- **Before:** Complex map picker with geocoding issues  
- **Now:** Simple link paste or GPS button, more reliable

---

## Quick Visual Test

### Order Form Should Look Like:
```
Mobile Number *
[🇮🇳 +91 ▼] [Enter mobile number....]

WhatsApp Number *                [🗐 Same as phone]
[🇮🇳 +91 ▼] [Enter WhatsApp number....]

...

Delivery Location (Optional)
[📍 Use Current Location] [📌 Pick on Map]
[🔗] [Paste Google Maps link here...] [↗]
```

### Volunteer Form Should Show:
```
Phone Number *
[🇮🇳 +91 ▼] [Enter phone number....]
❌ Phone number must be at least 10 digits ← Appears while typing!
```

---

## Known Issues & Limitations

1. **GPS May Fail**: Some browsers/devices don't support geolocation
   - Solution: Use "Pick on Map" instead

2. **Country Code Parsing**: Edit volunteer may not perfectly parse all formats
   - Default: Assumes +91 if unclear
   - Manually select correct country if needed

3. **Location Link Validation**: Only checks if it's a valid URL
   - Accepts any URL, not just Google Maps
   - This is intentional for flexibility

---

## Need Help?

If something doesn't work:
1. Check browser console for errors
2. Verify dev server is running on port 3001
3. Check that database has location_link column
4. Make sure environment variables are set

---

*Happy Testing! 🚀*
