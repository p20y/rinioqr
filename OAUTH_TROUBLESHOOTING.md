# OAuth Stuck at "Setting up your session..." - Troubleshooting

## Issue
OAuth callback page shows "Setting up your session..." indefinitely after Google authentication.

## Likely Causes

### 1. **PKCE Flow Not Configured (Most Likely)**
The callback is trying to exchange an authorization code for a session, but Supabase might not be configured for PKCE flow.

**Check in Supabase Dashboard:**
1. Go to Authentication → URL Configuration
2. Look for "Redirect URLs"
3. Ensure `http://localhost:3000/auth/callback` is listed
4. Check "Enable PKCE" or similar setting

### 2. **exchangeCodeForSession Hanging**
The API call to exchange the code might be timing out or failing silently.

**What to check:**
- Open browser DevTools → Console
- Look for debug logs I added:
  - "🔄 Starting OAuth callback..."
  - "📋 Authorization code: present"
  - "🔄 Exchanging code for session..."
  - If stuck here → Supabase API issue

### 3. **CORS or Network Issue**
The Supabase API request might be blocked.

**What to check:**
- Browser DevTools → Network tab
- Look for failed requests to `supabase.co`
- Check for CORS errors in console

---

## Quick Fix Options

### Option 1: Use Implicit Flow Instead (Fastest)
Change the OAuth flow from PKCE to implicit (tokens in URL hash).

**In Supabase Dashboard:**
1. Go to Authentication → Providers → Google
2. Look for "Flow Type" or similar
3. Change from "PKCE" to "Implicit" or "pkce" to "implicit"

Then update the callback to handle hash tokens instead of query code.

### Option 2: Verify PKCE Configuration (Recommended)
Ensure PKCE is properly configured:

**Supabase Dashboard Checklist:**
1. Authentication → URL Configuration
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

2. Authentication → Providers → Google
   - Enabled: ✅
   - Client ID: [your-google-client-id]
   - Client Secret: [your-google-client-secret]

3. Google Cloud Console:
   - OAuth 2.0 Client
   - Authorized redirect URIs must include:
     - `https://[your-project].supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for testing)

### Option 3: Add Fallback to Implicit Flow
Update callback to try both PKCE and implicit:

```typescript
// Try PKCE first (code in query)
const code = searchParams.get('code')
if (code) {
  await supabase.auth.exchangeCodeForSession(code)
}

// Fallback to implicit (tokens in hash)
const hashParams = new URLSearchParams(window.location.hash.substring(1))
const accessToken = hashParams.get('access_token')
if (accessToken && refreshToken) {
  await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
}
```

---

## Debug Steps

### 1. Check Browser Console
Open DevTools → Console and look for:
- ✅ "🔄 Starting OAuth callback..."
- ✅ "📋 Authorization code: present"
- ❌ Stuck at "🔄 Exchanging code for session..."

If stuck at "Exchanging code...", the issue is with Supabase configuration.

### 2. Check Network Tab
Open DevTools → Network:
- Look for requests to `auth/v1/token` or similar
- Status should be 200 OK
- If 400/401/403 → Configuration issue
- If no request → Code not reaching exchange call

### 3. Check Supabase Logs
In Supabase Dashboard:
- Go to Logs → Auth Logs
- Look for failed token exchange attempts
- Error messages will show configuration issues

### 4. Test with Implicit Flow
Temporarily test if implicit flow works:

Change `signInWithGoogle` in AuthContext to:
```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: callbackUrl.toString(),
    skipBrowserRedirect: false,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    }
  },
})
```

---

## Expected Flow (PKCE)

1. User clicks "Continue with Google" → `/login`
2. Redirects to Google OAuth
3. User authenticates
4. Google redirects to: `/auth/callback?code=xxx&redirectTo=/seller`
5. Callback extracts code: `searchParams.get('code')`
6. Calls: `supabase.auth.exchangeCodeForSession(code)`
7. Supabase API: `POST /auth/v1/token` with code
8. Returns session with access_token + refresh_token
9. Stores session in cookies
10. Redirects to `/seller`
11. Middleware checks session → allows access

**Where it's failing:** Step 6-8 (exchangeCodeForSession)

---

## Temporary Workaround

If you need OAuth to work immediately, revert to the old callback that handles implicit flow:

```typescript
// Check for tokens in URL hash (implicit flow)
const hashParams = new URLSearchParams(window.location.hash.substring(1))
const accessToken = hashParams.get('access_token')
const refreshToken = hashParams.get('refresh_token')

if (accessToken && refreshToken) {
  await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })
  window.location.href = safeRedirectTo
}
```

This will work if Supabase is configured for implicit flow instead of PKCE.

---

## Next Steps

1. **Check browser console** - What debug log is it stuck on?
2. **Check Supabase Dashboard** - Is PKCE enabled? Are redirect URLs correct?
3. **Check Google Console** - Are redirect URIs configured?
4. **Try the workaround** - See if implicit flow works

Let me know what you see in the console and I'll provide the specific fix!
