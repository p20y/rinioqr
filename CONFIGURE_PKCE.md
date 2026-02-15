# How to Configure Supabase for PKCE Flow

## What is PKCE?

PKCE (Proof Key for Code Exchange) is a more secure OAuth flow that:
- Uses authorization codes instead of tokens in the URL
- Prevents token interception attacks
- Better for Single Page Applications (SPAs)

## Current Issue

Your Supabase project is likely configured for **implicit flow** (tokens in URL hash), but our code is trying to use **PKCE flow** (code exchange). This causes `exchangeCodeForSession()` to hang.

---

## Option 1: Configure Supabase for PKCE (Recommended)

### Step 1: Check Supabase Dashboard

1. Go to **https://supabase.com/dashboard**
2. Select your project: `ybxnbjzwdabkgtunbygk`
3. Go to **Authentication** → **URL Configuration**

### Step 2: Verify Settings

Check these settings:

**Site URL:**
```
http://localhost:3000
```

**Redirect URLs (Additional Redirect URLs):**
```
http://localhost:3000/auth/callback
https://yourdomain.com/auth/callback
```

### Step 3: Check Flow Type

Look for a setting like:
- **"Flow Type"** or **"Auth Flow"**
- Should be set to **"pkce"** or **"authorization_code"**
- NOT "implicit" or "implicit_grant"

**If you don't see this setting:**
Supabase may auto-detect the flow type based on your client configuration.

### Step 4: Update Google OAuth Provider

1. Go to **Authentication** → **Providers**
2. Click on **Google**
3. Verify:
   - ✅ **Enabled**
   - ✅ **Client ID**: Your Google OAuth Client ID
   - ✅ **Client Secret**: Your Google OAuth Client Secret
   - ✅ **Authorized Client IDs**: (usually not needed)

### Step 5: Google Cloud Console Configuration

1. Go to **https://console.cloud.google.com**
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add:
   ```
   https://ybxnbjzwdabkgtunbygk.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```

**Important:** The Supabase callback URL is critical for PKCE to work!

---

## Option 2: Use Implicit Flow (Quick Fix)

If PKCE is causing issues, you can configure your app to use implicit flow instead.

### Update AuthContext.tsx

Change the `signInWithGoogle` function to force implicit flow:

```typescript
const signInWithGoogle = async (redirectTo?: string) => {
  try {
    const callbackUrl = new URL('/auth/callback', window.location.origin)
    if (redirectTo) {
      callbackUrl.searchParams.set('redirectTo', redirectTo)
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
        skipBrowserRedirect: false,
        // Force implicit flow (no code exchange)
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      },
    })

    return { error }
  } catch (err) {
    return { error: err as Error }
  }
}
```

**Note:** The callback page already handles both flows, so this will work!

---

## Option 3: Verify Current Flow Type

Let's check what flow Supabase is actually using:

### Test in Browser Console

1. Open **http://localhost:3000/login**
2. Open DevTools (F12) → Console
3. Paste and run:

```javascript
// Check localStorage for Supabase settings
Object.keys(localStorage).filter(k => k.includes('supabase'))
```

4. Click "Continue with Google"
5. After redirect, check the URL:

**PKCE Flow:**
```
http://localhost:3000/auth/callback?code=abc123&redirectTo=/seller
```

**Implicit Flow:**
```
http://localhost:3000/auth/callback#access_token=xyz&refresh_token=abc&...
```

- If you see `?code=` → PKCE flow
- If you see `#access_token=` → Implicit flow

---

## Recommended Configuration

For **production apps**, use PKCE because it's more secure.

### Complete Supabase Setup for PKCE:

1. **Supabase Dashboard** → Authentication → URL Configuration:
   ```
   Site URL: https://yourdomain.com
   Redirect URLs:
     - http://localhost:3000/auth/callback (dev)
     - https://yourdomain.com/auth/callback (prod)
   ```

2. **Supabase Dashboard** → Authentication → Providers → Google:
   ```
   Enabled: ✅
   Client ID: [from Google Cloud Console]
   Client Secret: [from Google Cloud Console]
   ```

3. **Google Cloud Console** → Credentials → OAuth 2.0 Client:
   ```
   Authorized redirect URIs:
     - https://ybxnbjzwdabkgtunbygk.supabase.co/auth/v1/callback
     - http://localhost:3000/auth/callback
   ```

4. **Your Code** (already done):
   ```typescript
   // Client uses createBrowserClient from @supabase/ssr
   // Middleware uses createServerClient from @supabase/ssr
   // Callback handles both PKCE and implicit flows
   ```

---

## Troubleshooting

### PKCE Still Hanging?

The issue might be that Supabase Auth is not configured correctly. Check:

1. **Network Tab** (DevTools → Network):
   - Look for request to `/auth/v1/token`
   - If 400/401 → Google OAuth credentials are wrong
   - If CORS error → Redirect URL not configured
   - If no request → `exchangeCodeForSession` not calling API

2. **Supabase Logs**:
   - Dashboard → Logs → Auth Logs
   - Look for failed OAuth attempts
   - Check error messages

3. **Verify Google OAuth**:
   ```bash
   # The Client ID and Secret in Supabase must match Google Console
   ```

### Quick Test: Disable PKCE Temporarily

Update callback to skip PKCE and only use implicit/session check:

```typescript
// Comment out PKCE section in callback
if (code) {
  console.log('⚠️ PKCE disabled for testing')
  // Skip to implicit flow check
}
```

Then test if Google OAuth works with implicit flow.

---

## Expected Working Flow (PKCE)

1. User clicks "Continue with Google" → `/login`
2. `signInWithGoogle()` redirects to Google
3. Google redirects to Supabase callback:
   ```
   https://ybxnbjzwdabkgtunbygk.supabase.co/auth/v1/callback?code=...
   ```
4. Supabase verifies code and redirects to your app:
   ```
   http://localhost:3000/auth/callback?code=abc123
   ```
5. Your callback page calls `exchangeCodeForSession(code)`
6. Supabase API exchanges code for session tokens
7. Session stored in cookies
8. Redirect to `/seller`
9. Middleware detects session → allows access

**Where it's failing:** Step 6 - the exchange call is hanging

---

## My Recommendation

Since PKCE is hanging, I recommend **using implicit flow** for now to get OAuth working, then we can debug PKCE later.

The callback page **already supports both flows**, so just:

1. Verify Google OAuth redirect URIs include Supabase callback
2. Test Google OAuth again
3. Check if it works via implicit flow (URL hash tokens)

Let me know:
- What do you see in the URL after Google redirect? `?code=` or `#access_token=`?
- Do you want to stick with PKCE or switch to implicit flow?
