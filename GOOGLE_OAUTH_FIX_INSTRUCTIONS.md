# Google OAuth Fix Instructions for Production Deployment

## 1. Environment Variables (Already Updated)
Your `.env.local` file has been updated with the correct production URLs:
```
NEXT_PUBLIC_APP_URL=https://crackatom.vercel.app
NEXT_PUBLIC_SITE_URL=https://crackatom.vercel.app
NEXTAUTH_URL=https://crackatom.vercel.app
```

## 2. Google Cloud Console Configuration (Required Manual Step)

### Add Authorized Redirect URIs:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" → "Credentials"
4. Find your OAuth 2.0 Client ID
5. Add these authorized redirect URIs:
   ```
   https://crackatom.vercel.app/auth/callback
   https://crackatom.vercel.app/
   ```

## 3. Supabase Authentication Configuration (Required Manual Step)

### Update Redirect URLs:
1. Go to your Supabase project dashboard
2. Navigate to Authentication → URL Configuration
3. In "Additional Redirect URLs", add:
   ```
   https://crackatom.vercel.app
   https://crackatom.vercel.app/auth/callback
   ```

## 4. Verify OAuth Client Configuration

Make sure your Google OAuth client is configured correctly:
- **Authorized JavaScript origins**: `https://crackatom.vercel.app`
- **Authorized redirect URIs**: As listed above

## 5. Test the Configuration

After making these changes:
1. Deploy your updated code to Vercel
2. Clear your browser cache/cookies
3. Try signing in with Google OAuth

## 6. Troubleshooting

If you still encounter issues:
1. Check browser console for errors
2. Verify all environment variables are set in Vercel
3. Ensure the Google OAuth client ID and secret are correct in your Supabase settings
4. Check Supabase auth logs for any error messages

The key changes made to your code:
- Updated `.env.local` to use production URLs
- Ensured OAuth redirect URLs use `window.location.origin` for dynamic URL construction
- Verified the auth callback route properly handles production URLs