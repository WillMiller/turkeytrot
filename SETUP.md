# Setup Instructions

## Disable Email Confirmation in Supabase

To allow users to register without email verification:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers** > **Email**
3. Scroll down to **"Confirm email"**
4. **Disable** the "Confirm email" toggle
5. Click **Save**

This allows users to sign up and immediately access their account without needing to verify their email address.

## Environment Variables

Make sure your `.env.local` file contains:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

The service role key is required for admin operations (user management).
