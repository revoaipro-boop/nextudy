# Google OAuth Setup Guide

This guide explains how to configure Google OAuth authentication for your Next.js application with Supabase.

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add name: "Nextudy OAuth"

5. Configure authorized redirect URIs:
   \`\`\`
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   \`\`\`
   
   Replace `[YOUR-PROJECT-REF]` with your Supabase project reference ID (found in Supabase Dashboard URL)

6. Save the credentials and note down:
   - Client ID
   - Client Secret

## Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to "Authentication" > "Providers"
4. Find "Google" in the list and enable it
5. Enter your Google OAuth credentials:
   - Client ID (from Step 1)
   - Client Secret (from Step 1)
6. Click "Save"

## Step 3: Configure Redirect URLs in Supabase

1. Still in Supabase Dashboard, go to "Authentication" > "URL Configuration"
2. Add these URLs to "Redirect URLs":

**Production:**
\`\`\`
https://nextudy.fr/auth/callback
https://nextudy.fr/
\`\`\`

**Development (optional):**
\`\`\`
http://localhost:3000/auth/callback
http://localhost:3000/
\`\`\`

3. Set "Site URL" to your production URL:
\`\`\`
https://nextudy.fr
\`\`\`

4. Click "Save"

## Step 4: Update Environment Variables

No additional environment variables are needed! The existing Supabase variables are sufficient:
- `NEXT_PUBLIC_SUPABASE_URL` (already set)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (already set)

## Step 5: Test Google OAuth

1. Go to your login page: `/auth/login`
2. Click "Continuer avec Google"
3. You should be redirected to Google's consent screen
4. After authorizing, you'll be redirected back to your app
5. The callback handler will:
   - Exchange the OAuth code for a session
   - Check if user is approved (activation_tokens.used = true)
   - Create the session if approved
   - Redirect to homepage or pending-approval page

## Troubleshooting

### "Access blocked: This app's request is invalid"
- Make sure you've enabled the Google+ API in Google Cloud Console
- Verify the redirect URI in Google Cloud Console matches exactly: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`

### "Redirect URL not allowed"
- Check Supabase Dashboard > Authentication > URL Configuration
- Ensure your callback URLs are in the "Redirect URLs" list
- URLs must match exactly (no trailing slashes, correct protocol)

### User redirected to `/auth/pending-approval`
- This is expected for new users
- Admin must approve the user first (see AUTH_SETUP.md)
- Run SQL:
  \`\`\`sql
  UPDATE profiles 
  SET verification_status = 'approved', is_verified = true 
  WHERE id = 'user-uuid';
  \`\`\`

### Session not created after OAuth
- Check browser console for `[v0]` debug messages
- Verify callback route is working: `/auth/callback/route.ts`
- Check Supabase logs for authentication errors
- Ensure `NEXT_PUBLIC_APP_URL` is set correctly

## Security Best Practices

1. **Never commit credentials**: Keep Client ID and Client Secret secure
2. **Use environment variables**: Store sensitive data in Vercel environment variables
3. **Restrict OAuth scopes**: Only request necessary permissions
4. **Monitor usage**: Check Google Cloud Console for suspicious activity
5. **Rotate secrets**: Periodically regenerate OAuth credentials

## OAuth Flow Diagram

\`\`\`
User clicks "Continue with Google"
         ↓
Redirected to Google consent screen
         ↓
User authorizes application
         ↓
Google redirects to Supabase callback
         ↓
Supabase validates and creates session
         ↓
Redirects to /auth/callback in your app
         ↓
App checks activation status
         ↓
     ┌──────┴──────┐
     ↓             ↓
Approved      Pending
     ↓             ↓
Homepage    Pending page
\`\`\`

## Additional Resources

- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Authentication Patterns](https://nextjs.org/docs/authentication)
