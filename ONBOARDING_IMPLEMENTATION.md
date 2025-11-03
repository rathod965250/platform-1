# User Onboarding Implementation

## Overview

This document describes the comprehensive user onboarding system that collects essential user information and initializes the adaptive algorithm for personalized learning experiences.

## Database Integration

### Profiles Table (`profiles`)
The onboarding collects and updates:
- `college` (TEXT) - User's college/university name
- `graduation_year` (INTEGER) - Expected graduation year
- `target_companies` (TEXT[]) - Array of companies user wants to prepare for
- `phone` (TEXT, optional) - User's phone number

### Adaptive State Table (`adaptive_state`)
For each selected category during onboarding, the system initializes:
- `user_id` (UUID) - References profiles.id
- `category_id` (UUID) - References categories.id
- `mastery_score` (DECIMAL) - Default: 0.50 (50%)
- `current_difficulty` (TEXT) - Default: 'medium'
- `recent_accuracy` (DECIMAL[]) - Empty array initially
- `avg_time_seconds` (INTEGER) - Default: 0

## Migration Files

### `005_add_adaptive_initialization_function.sql`
Creates the `initialize_adaptive_state_batch()` function that:
- Takes a user_id and array of category_ids
- Initializes adaptive_state for each category
- Uses upsert to handle existing records
- Returns count of initialized categories

**Usage:**
```sql
SELECT initialize_adaptive_state_batch(
  'user-uuid-here'::UUID,
  ARRAY['category-1-uuid'::UUID, 'category-2-uuid'::UUID]
);
```

## Onboarding Flow

### Step 1: Basic Information
- **College/University Name** (Required)
- **Graduation Year** (Required, dropdown with next 5 years)
- **Phone Number** (Optional)

### Step 2: Target Companies
- Multi-select from common companies:
  - IT Services: TCS, Infosys, Wipro, Accenture, Cognizant, HCL, Tech Mahindra
  - Tech Giants: Microsoft, Google, Amazon, Apple, Meta, Oracle, IBM
  - Finance: Goldman Sachs, Morgan Stanley, JP Morgan, Deloitte, PwC, KPMG
  - Consumer Goods: Unilever, P&G, Nestle, Coca-Cola, PepsiCo
  - Startups: Flipkart, Amazon India, Swiggy, Zomato, Paytm, Razorpay
- **Custom Company Input** - Users can add companies not in the list

### Step 3: Practice Categories
- Multi-select from available categories:
  - Quantitative Aptitude
  - Logical Reasoning
  - Verbal Ability
  - Data Interpretation
  - Problem Solving
- **Important**: Selected categories initialize the adaptive algorithm
- Each selected category creates an entry in `adaptive_state` table

### Step 4: Review
- Displays all collected information
- Final confirmation before completion

## File Structure

### Pages
- `src/app/(auth)/onboarding/page.tsx` - Main onboarding page with authentication check

### Components
- `src/components/onboarding/OnboardingForm.tsx` - Multi-step onboarding form

### API Routes
- `src/app/api/onboarding/initialize-adaptive/route.ts` - API endpoint for batch adaptive state initialization (optional, form uses direct database access)

### Database Migrations
- `supabase/migrations/005_add_adaptive_initialization_function.sql` - Creates batch initialization function

## Integration Points

### 1. Signup Flow
**File**: `src/components/auth/SignupForm.tsx`
- After successful signup, redirects to `/onboarding`
- Users complete profile before accessing dashboard

### 2. Login Flow
**File**: `src/components/auth/LoginForm.tsx`
- After login, checks if profile is complete
- Checks if adaptive_state exists
- Redirects to onboarding if incomplete

### 3. Auth Callback
**File**: `src/app/auth/callback/route.ts`
- After OAuth/email confirmation, checks onboarding status
- Redirects to onboarding if profile incomplete or no adaptive_state

### 4. Server Actions
**File**: `src/app/auth/actions.ts`
- Server-side signup action redirects to onboarding
- Ensures new users complete onboarding

## Adaptive Algorithm Initialization

### Default Values
When a user selects categories during onboarding:
- **mastery_score**: 0.50 (50%) - Starting proficiency level
- **current_difficulty**: 'medium' - Initial question difficulty
- **recent_accuracy**: [] - Empty array (tracked as user practices)
- **avg_time_seconds**: 0 - Will be calculated during practice sessions

### How It Works
1. User selects categories in Step 3 of onboarding
2. On submission, system calls `initialize_adaptive_state_batch()` RPC function
3. If RPC doesn't exist, falls back to direct `upsert` operations
4. Creates one `adaptive_state` record per selected category
5. Adaptive algorithm is now ready to track user performance

### Connection to Practice
The `AdaptivePracticeInterface` component:
- Reads from `adaptive_state` to determine starting difficulty
- Updates `adaptive_state` after each question
- Uses `user_metrics` table to log individual attempts
- Updates `session_stats` with aggregated session data

## Onboarding Completion Check

A user has completed onboarding if:
1. ✅ Profile has `college` filled
2. ✅ Profile has `graduation_year` filled
3. ✅ Profile has `target_companies` array with at least one company
4. ✅ At least one `adaptive_state` record exists for the user

## Routes

- `/onboarding` - Main onboarding page (protected, requires authentication)
- `/api/onboarding/initialize-adaptive` - API endpoint for adaptive state initialization

## Styling

All onboarding pages match the theme from `globals.css`:
- Uses `bg-background`, `text-foreground`, `text-muted-foreground`
- Primary color (`text-primary`) for CTAs and highlights
- Consistent spacing and typography
- Smooth transitions and hover states

## Next Steps After Onboarding

1. User is redirected to `/dashboard`
2. Adaptive algorithm is ready for practice sessions
3. User can start practicing in selected categories
4. Algorithm will adjust difficulty based on performance
5. Metrics are tracked in `user_metrics` and `session_stats` tables

## Database Functions

### `initialize_adaptive_state_batch(p_user_id, p_category_ids)`
**Purpose**: Batch initialize adaptive state for multiple categories

**Parameters**:
- `p_user_id` (UUID) - User's ID
- `p_category_ids` (UUID[]) - Array of category IDs to initialize

**Returns**: INTEGER - Count of initialized categories

**Behavior**:
- Uses `ON CONFLICT` to handle existing records
- Sets default values: mastery_score=0.50, difficulty='medium'
- Updates `last_updated` timestamp

## Testing Checklist

- [ ] New user signup redirects to onboarding
- [ ] Onboarding form validates required fields
- [ ] Profile data saves correctly
- [ ] Adaptive state initializes for selected categories
- [ ] User cannot skip onboarding (checks in place)
- [ ] Completed onboarding redirects to dashboard
- [ ] Incomplete profile redirects to onboarding on login
- [ ] OAuth users go through onboarding
- [ ] Form handles errors gracefully
- [ ] Progress bar updates correctly

## Notes

- The onboarding page checks authentication before rendering
- Users who already completed onboarding are redirected to dashboard
- Adaptive state initialization is non-blocking (onboarding succeeds even if it fails)
- Custom companies are saved in the `target_companies` array
- Selected categories determine which adaptive states are initialized

