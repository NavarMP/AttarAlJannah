# Implementation Plan: 6 Critical Fixes

## Issue 1: Volunteer Login Blank Page
**Problem:** Clicking volunteer login shows blank page
**Root Cause:** `export const dynamic = "force-dynamic"` at top of file
**Solution:** Remove or move after imports
**File:** `/app/volunteer/login/page.tsx`

## Issue 2: No Login Button on Home Page (Not Logged In)
**Problem:** Login button not showing for non-logged-in volunteer users
**Solution:** Add volunteer login check and display button
**File:** `/app/page.tsx` or hero section component

## Issue 3: /customer/ Slow Loading
**Problem:** Customer dashboard takes long to load
**Solution:** 
- Add loading skeleton
- Lazy load components
- Optimize data fetching
**File:** `/app/customer/dashboard/page.tsx`

## Issue 4: Form Data Persistence
**Problem:** Form data lost when user leaves page
**Solution:**
- Use localStorage to save form data on change
- Restore on page load
- Clear on successful submission
**File:** `/components/forms/order-form.tsx`

## Issue 5: Leaderboard/Dashboard Bottle Count Sync Issue
**Problem:** Bottle counts not syncing in leaderboard and volunteer dashboard
**Root Cause:** Different data fetching logic or caching
**Solution:**
- Check API response structure
- Ensure consistent data calculation
- Add revalidation
**Files:** 
- `/app/volunteer/leaderboard/page.tsx`
- `/app/volunteer/dashboard/page.tsx`
- `/app/api/volunteer/leaderboard/route.ts`
- `/app/api/volunteer/stats/route.ts`

## Issue 6: Immediate Thanks Page Redirect
**Problem:** User waits on order page while poster/invoice loads
**Solution:**
- Redirect to /thanks immediately after order submission
- Show "Order Placed Successfully!" message first
- Load poster and invoice asynchronously with loading states
- Show progress indicators
**Files:**
- `/components/forms/order-form.tsx` (redirect immediately)
- `/app/thanks/page.tsx` (async loading)
- `/components/thank-you-poster.tsx` (lazy load)

## Priority Order
1. Issue 6 (UX critical - order placement)
2. Issue 4 (UX - form persistence)
3. Issue 1 (Bug - blank page)
4. Issue 5 (Data sync)
5. Issue 2 (UI - login button)
6. Issue 3 (Performance - loading speed)
