# Error Logging Fix - Empty Object `{}` Error

## Problem Description

The browser console was showing `[ERROR] {}` - an empty object being logged as an error. This is a common issue in JavaScript/TypeScript applications.

## Root Cause

The `{}` error occurs when:

1. **Non-Error objects are thrown**: When code throws something other than an Error object (like `null`, `undefined`, or a plain object), `console.error()` may display it as `{}`

2. **Error objects with non-enumerable properties**: Standard JavaScript Error objects have non-enumerable properties (`message`, `stack`, etc.). When logged directly, they may appear as empty objects `{}` because the console can't enumerate their properties

3. **Serialization issues**: Some error objects can't be properly serialized for display in the console

4. **Supabase/API errors**: Errors from external libraries may have different structures that don't display well when logged directly

## Example of the Problem

```typescript
// ❌ BAD - May log as {}
try {
  // some code
} catch (err) {
  console.error(err) // Could show as {}
}
```

## The Solution

### 1. Created Error Logging Utility

Created `/src/lib/utils/error-logger.ts` with helper functions:

- **`getErrorMessage(error: unknown)`**: Safely extracts error messages from various error types
- **`logError(context: string, error: unknown)`**: Logs errors with context and proper formatting
- **`logWarning(context: string, message: string)`**: Logs warnings consistently
- **`logInfo(context: string, message: string)`**: Logs info messages consistently

### 2. Proper Error Handling Pattern

```typescript
import { logError } from '@/lib/utils/error-logger'

// ✅ GOOD - Always logs meaningful messages
try {
  // some code
} catch (err) {
  logError('ComponentName', err) // Shows: ❌ ComponentName: [actual error message]
}
```

## Benefits

1. **Meaningful error messages**: Always see what actually went wrong
2. **Consistent formatting**: All errors follow the same pattern with emoji indicators
3. **Better debugging**: In development mode, full error objects and stack traces are logged
4. **Type-safe**: Handles `unknown` error types properly
5. **Supabase-aware**: Handles Supabase error structures correctly

## Files Modified

1. **Created**: `/src/lib/utils/error-logger.ts` - Error logging utility
2. **Updated**: `/src/components/shared/CategoriesTest.tsx` - Example implementation

## Recommended Next Steps

To fully fix this across your codebase, update all catch blocks to use the error logging utility:

### Find all instances:
```bash
# Search for catch blocks that might have this issue
grep -r "console.error(err)" src/
grep -r "console.error(error)" src/
```

### Update pattern:
```typescript
// Before
catch (err) {
  console.error(err)
}

// After
import { logError } from '@/lib/utils/error-logger'

catch (err) {
  logError('ComponentName', err)
}
```

## Testing

After the fix, errors will appear as:
```
❌ CategoriesTest: Failed to fetch categories
Full error: Error { ... }
Stack trace: ...
```

Instead of:
```
[ERROR] {}
```

## Additional Notes

- The utility automatically provides more details in development mode
- Stack traces are included for Error objects in development
- The utility handles various error types: Error objects, strings, Supabase errors, and unknown types
- All error logging is now centralized and can be easily extended (e.g., to send to error tracking services like Sentry)
