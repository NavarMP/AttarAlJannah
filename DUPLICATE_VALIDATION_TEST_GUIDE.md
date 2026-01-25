# Quick Test: Duplicate Validation

## How to Test the Duplicate Checking

### Test 1: New Volunteer - Duplicate Name

1. Navigate to `http://localhost:3001/admin/volunteers/new`
2. Start typing a name of an existing volunteer (e.g., "Volunteer One")
3. **Expected Result:**
   - After ~800ms, you'll see a spinner appear in the input field
   - Then you'll see "Checking availability..."
   - Then a red border appears + "❌ A volunteer with this name already exists"
   - Submit button is disabled/blocked

4. Change the name to something unique
5. **Expected Result:**
   - Error clears automatically
   - Red border disappears
   - Can submit the form

---

### Test 2: New Volunteer - Duplicate Volunteer ID

1. Still on `/admin/volunteers/new`
2. In the "Volunteer ID" field, type an existing ID (e.g., "VOL001")
3. **Expected Result:**
   - Spinner appears after ~800ms
   - "Checking availability..." message
   - Red border + "❌ This volunteer ID is already in use"
   - Submit blocked

4. Clear the field or type a new ID
5. **Expected Result:**
   - Error clears
   - Can submit

---

### Test 3: Edit Volunteer - Own Name/ID (Should NOT Error)

1. Navigate to `/admin/volunteers`
2. Click "Edit" on any volunteer
3. The form loads with their current name and ID
4. **Expected Result:**
   - NO duplicate errors appear (even though the name/ID exists in database)
   - This is correct behavior - you can keep your own name/ID

---

### Test 4: Edit Volunteer - Change to Another's Name

1. On the edit page from Test 3
2. Change the name to match ANOTHER volunteer's name
3. **Expected Result:**
   - After ~800ms: Spinner → "Checking availability..."
   - Red border + "❌ A volunteer with this name already exists"
   - Submit blocked

4. Change it back to original name or a unique name
5. **Expected Result:**
   - Error clears
   - Can submit

---

### Test 5: Edit Volunteer - Change to Another's ID

1. On the edit page
2. Change the Volunteer ID to match another volunteer's ID
3. **Expected Result:**
   - Duplicate error appears
   - Submit blocked  

4. Revert or use unique ID
5. **Expected Result:**
   - Can submit

---

## Visual Indicators to Look For

### While Checking (Loading State)
```
Full Name *
[Volunteer Name.....     🔄]  ← Spinner in input
Checking availability...      ← Gray text below
```

### Duplicate Found (Error State)
```
Full Name *
[Volunteer Name.....        ]  ← Red border
❌ A volunteer with this name already exists  ← Red error
```

### Available/Valid (Success State)
```
Full Name *
[Volunteer Name.....        ]  ← Normal border
                                ← No error message
```

---

## Expected Behavior Summary

| Scenario | Result |
|----------|--------|
| New volunteer: Type existing name | ❌ Error shown, submit blocked |
| New volunteer: Type unique name | ✅ No error, can submit |
| New volunteer: Type existing ID | ❌ Error shown, submit blocked |
| New volunteer: Leave ID empty | ✅ No error (auto-generated) |
| Edit: Keep own name/ID | ✅ No error (excluded from check) |
| Edit: Change to another's name | ❌ Error shown, submit blocked |
| Edit: Change to another's ID | ❌ Error shown, submit blocked |
| Edit: Change to unique name/ID | ✅ No error, can submit |

---

## Database Setup Note

Make sure you have some volunteers in your database to test against!

If you don't have any, create a couple first:
1. Go to `/admin/volunteers/new`
2. Create "Test Volunteer 1" with ID "TEST001"
3. Create "Test Volunteer 2" with ID "TEST002"

Now you can test duplicate checking by trying to create another with same name/ID!

---

## Common Issues & Solutions

**Issue:** No error appears when typing duplicate name
- **Solution:** Check browser console for API errors
- **Solution:** Verify the check-duplicate API route exists
- **Solution:** Make sure volunteer exists in database with that name

**Issue:** Error appears even for own name in edit mode
- **Solution:** Check that `excludeId` is being passed to API
- **Solution:** Verify the volunteer `id` is correctly loaded

**Issue:** Checking takes too long
- **Solution:** This is normal - there's an 800ms debounce delay
- **Solution:** If longer, check database connection/performance

---

Happy Testing! 🎉
