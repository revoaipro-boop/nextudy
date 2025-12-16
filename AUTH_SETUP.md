# Authentication System Setup

This application uses a secure authentication system with the following features:

## Features

1. **Pending User Validation**: New user accounts are created in a pending state and require admin approval
2. **Admin Email Notifications**: Admins receive email notifications when new users sign up
3. **Email Verification for Login**: Each login requires email verification via a magic link
4. **Session Expiration**: Sessions automatically expire after 2 successful logins, requiring re-verification

## Required Environment Variables

Add these environment variables to your Vercel project or `.env.local` file:

### Email Configuration (Gmail SMTP)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ADMIN_EMAIL=admin@tonsite.fr
```

### Application URL

```env
NEXT_PUBLIC_APP_URL=https://nextudy.fr
```

For local development, use `http://localhost:3000`

**IMPORTANT**: This URL is critical for magic link authentication. Make sure it matches your actual deployment URL in production.

### Existing Supabase Variables

These should already be configured:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- All Postgres connection variables

## Setup Instructions

### 1. Configure Gmail SMTP

1. Use your Gmail account or create a dedicated one for sending emails
2. Enable 2-factor authentication on your Google account
3. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
4. Add the SMTP variables to your environment

### 2. Update Email Addresses

In the following files, replace `no-reply@tonsite.fr` with your Gmail address:
- `lib/email.ts` (both functions)

Replace `admin@tonsite.fr` with your actual admin email address or set the `ADMIN_EMAIL` environment variable.

### 3. Run Database Migration

Execute the SQL migration to add the verification system:

```bash
# The migration script is located at:
scripts/013_add_verification_system.sql
```

This will:
- Add verification columns to the `profiles` table
- Create the `login_verification_tokens` table
- Update the user creation trigger
- Set up proper RLS policies

### 4. Configure Supabase Redirect URLs

**CRITICAL**: For magic link authentication to work, you MUST configure the redirect URLs in Supabase:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. In the **Redirect URLs** section, add:

**Production URLs:**
```
https://nextudy.fr/auth/session-handler
https://nextudy.fr/
```

**Development URLs (optional):**
```
http://localhost:3000/auth/session-handler
http://localhost:3000/
```

5. Click **Save**

**Why this is required**: When users click the magic link in their email, Supabase redirects them back to your application with authentication tokens in the URL hash. Supabase will only redirect to URLs that are explicitly configured in this list for security reasons.

### 5. Admin Approval Process

After a user signs up:
1. Admin receives an email with user details (display name and UUID)
2. Admin must manually approve the user by updating their profile in Supabase:

```sql
UPDATE profiles 
SET verification_status = 'approved', is_verified = true 
WHERE id = 'user-uuid-here';
```

You can create an admin dashboard to manage this process.

## Authentication Flow

### Sign Up
1. User fills out registration form
2. Account is created with `verification_status = 'pending'`
3. Admin receives notification email with activation link
4. User sees success message explaining they need approval

### Admin Activation
1. Admin receives email with secure activation link
2. Admin clicks the link to approve the user
3. User's `verification_status` is set to `'approved'`
4. User receives confirmation (if email notifications are enabled)

### Login (Magic Link)
1. User enters their email address on `/auth/login`
2. System checks if user is approved
3. If approved, sends magic link to user's email
4. User clicks the magic link in their email
5. **Magic link redirects to `/auth/session-handler`**
6. Session handler extracts tokens from URL hash (`#access_token` and `#refresh_token`)
7. Session handler calls `supabase.auth.setSession()` with the tokens
8. User is automatically logged in and redirected to homepage
9. Login count is incremented

### Session Management
- Each successful login increments the `login_count`
- After 2 logins, the session expires
- User must request a new verification email to continue
- Login count resets when session expires

## Security Features

- **No password transmission**: Magic link authentication
- **Time-limited tokens**: Verification links expire after 15 minutes
- **One-time use**: Tokens can only be used once
- **Admin approval**: Prevents unauthorized access
- **Session limits**: Forces periodic re-verification
- **Row Level Security**: All database operations are protected

## Troubleshooting

### Magic links not working
- **Ensure `NEXT_PUBLIC_APP_URL` is set correctly** in your Vercel environment variables
- For production: `https://nextudy.fr`
- For local development: `http://localhost:3000`
- **Verify Supabase redirect URLs are configured** (see step 4 above)
- Check that tokens haven't expired (15 minute limit)
- Verify the token hasn't already been used
- Look at the debug information in the session handler page
- Check browser console for detailed error messages

### "No tokens found" error
- **Most common cause**: Supabase redirect URLs not configured correctly
- Go to Supabase Dashboard → Authentication → URL Configuration
- Ensure `https://nextudy.fr/auth/session-handler` is in the Redirect URLs list
- Verify `NEXT_PUBLIC_APP_URL` matches your actual deployment URL exactly (no trailing slash)
- Check that the email contains the correct redirect URL
- Open browser DevTools (F12) and check the Console tab for `[v0]` debug messages
- The URL should contain `#access_token=...` after clicking the magic link

### "Redirect URL not allowed" error
- This error means Supabase is blocking the redirect
- Add the URL to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
- Make sure there are no typos in the URL
- URLs are case-sensitive and must match exactly

### Users can't log in after clicking magic link
- Check browser console for detailed error messages
- Verify the session handler page is accessible at `/auth/session-handler`
- Ensure Supabase environment variables are set correctly
- Check if their `verification_status` is `'approved'` in the database

### Admin not receiving emails
- Verify the SMTP credentials are correct
- Check the `ADMIN_EMAIL` environment variable
- Look for errors in the application logs
- Ensure Gmail App Password is valid

### Still having issues?

See the detailed troubleshooting guide in `SUPABASE_REDIRECT_SETUP.md` for step-by-step debugging instructions.

## Future Enhancements

Consider adding:
- Admin dashboard for user approval
- Email notifications to users when approved/rejected
- Configurable session limits
- Two-factor authentication
- OAuth providers (Google, GitHub, etc.)
