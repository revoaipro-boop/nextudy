# Deployment Guide

## Production URL Configuration

This application is deployed at: **https://nextudy.fr**

### Critical Environment Variables for Production

Make sure the following environment variable is set in your Vercel project:

\`\`\`env
NEXT_PUBLIC_APP_URL=https://nextudy.fr
\`\`\`

This URL is used for:
- Magic link authentication redirects
- Admin activation email links
- Login verification email links

### Vercel Deployment Steps

1. **Set Environment Variables** in Vercel Dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add/update `NEXT_PUBLIC_APP_URL` with the production URL
   - Ensure all Supabase variables are set
   - Ensure all SMTP variables are set

2. **Redeploy** after changing environment variables:
   - Environment variable changes require a new deployment
   - Go to Deployments tab and click "Redeploy"

3. **Test the Magic Link Flow**:
   - Try logging in with an approved account
   - Check that the magic link email contains the correct URL
   - Verify that clicking the link logs you in successfully
   - Check browser console for any errors

### Supabase Configuration

**CRITICAL STEP**: Configure redirect URLs in Supabase Dashboard to enable magic link authentication.

#### Step-by-Step Instructions:

1. **Go to Supabase Dashboard**
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to Authentication Settings**
   - Click on **Authentication** in the left sidebar
   - Click on **URL Configuration**

3. **Add Redirect URLs**
   
   In the **Redirect URLs** field, add the following URLs (one per line):

   **Production URLs (REQUIRED):**
   \`\`\`
   https://nextudy.fr/auth/session-handler
   https://nextudy.fr/
   \`\`\`

   **Development URLs (OPTIONAL - for local testing):**
   \`\`\`
   http://localhost:3000/auth/session-handler
   http://localhost:3000/
   \`\`\`

4. **Save Configuration**
   - Click the **Save** button at the bottom
   - Wait for confirmation that settings were saved

5. **Verify Configuration**
   - The URLs should now appear in the Redirect URLs list
   - Make sure there are no typos or extra spaces

#### Why This Is Required

When a user clicks the magic link in their email:
1. They are redirected to Supabase's authentication server
2. Supabase validates the link and generates session tokens
3. Supabase redirects back to your app with tokens in the URL hash: `#access_token=...&refresh_token=...`
4. **Supabase will ONLY redirect to URLs in the Redirect URLs list** for security

If the redirect URL is not configured, users will see:
- "Redirect URL not allowed" error
- "No tokens found" error
- Or be redirected to the wrong page

### Testing Checklist

- [ ] `NEXT_PUBLIC_APP_URL` is set to `https://nextudy.fr` in Vercel
- [ ] Supabase redirect URLs are configured (see above)
- [ ] Magic link emails contain correct production URL
- [ ] Clicking magic link successfully logs in user
- [ ] No "No tokens found" errors in session handler
- [ ] Admin activation emails contain correct production URL
- [ ] Session persists across page refreshes
- [ ] Logout works correctly

### Common Issues

**Issue**: Magic links redirect to localhost instead of production
- **Solution**: Update `NEXT_PUBLIC_APP_URL` in Vercel and redeploy

**Issue**: "No tokens found" error after clicking magic link
- **Solution**: Add `https://nextudy.fr/auth/session-handler` to Supabase Redirect URLs

**Issue**: "Redirect URL not allowed" error
- **Solution**: Check Supabase Dashboard → Authentication → URL Configuration
- Ensure the exact URL is in the Redirect URLs list
- URLs are case-sensitive and must match exactly (no trailing slash on the base URL)

**Issue**: CORS errors or authentication failures
- **Solution**: Verify all Supabase environment variables are set correctly

**Issue**: Tokens appear in URL but session not created
- **Solution**: Check browser console for `[v0]` debug messages
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Check that the session-handler page is loading correctly

### Local Development

For local development, use:

\`\`\`env
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

Or set the `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` variable:

\`\`\`env
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
\`\`\`

### Detailed Troubleshooting

For comprehensive debugging instructions, see `SUPABASE_REDIRECT_SETUP.md`.
