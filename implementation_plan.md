# Implementation Plan - Amazon Review QR Solution

## Goal
Build a web application that allows sellers to generate QR codes for their Amazon products. When consumers scan these codes, they are directed to a landing page where they can easily leave a review on Amazon.

## User Review Required
> [!NOTE]
> **Supabase Integration**: I will use **Supabase** (PostgreSQL) for the database.
> *   **Free Tier**: Supabase has a generous free tier that will cost $0.
> *   **Clean URLs**: QR codes will contain a unique ID (e.g., `.../p/123xyz`) instead of raw data, looking more professional.
> *   **Editable**: You can change the product name or ASIN later without re-printing the QR code.
>
> **Database Update Required**:
> Please run the following SQL in your Supabase Dashboard to support the new "Disable" feature and fix the "Delete" issue:
> ```sql
> -- Add is_active column
> alter table products add column is_active boolean default true;
> 
> -- Fix permissions (Allow Delete and Update)
> create policy "Enable delete for anon" on products for delete using (true);
> create policy "Enable update for anon" on products for update using (true);
> ```

## Proposed Changes

### Tech Stack
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: **Tailwind CSS** + **shadcn/ui** (Premium UI Components)
- **Database**: **Supabase** (PostgreSQL)
- **QR Code**: `qrcode.react`

### Architecture

#### generic
- **[NEW] [lib/supabaseClient.ts](file:///Users/pradeepsrini/projects/rinioqr/rinioqr/lib/supabaseClient.ts)**: Supabase client initialization.
- **[NEW] [types/supabase.ts](file:///Users/pradeepsrini/projects/rinioqr/rinioqr/types/supabase.ts)**: Database type definitions.

#### frontend/seller
- **[NEW] [app/seller/page.tsx](file:///Users/pradeepsrini/projects/rinioqr/rinioqr/app/seller/page.tsx)**: 
    - Form to add products (saves to Supabase).
    - Lists existing products fetching from Supabase.
    - Generates QR code for `https://[app-url]/p/[uuid]`.

#### frontend/consumer
- **[NEW] [app/p/[id]/page.tsx](file:///Users/pradeepsrini/projects/rinioqr/rinioqr/app/p/[id]/page.tsx)**: 
    - Dynamic route `[id]`.
    - Fetches product details from Supabase using `id`.
    - Displays "Review [Name]" page.
    - Redirects to `https://www.amazon.com/review/create-review?asin={asin}`.

## Data Model

```prisma
```sql
create table products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  asin text not null,
  image_url text,
  is_active boolean default true
);
```
```

## Verification Plan

### Automated Tests
- None planned for MVP.

1.  **Seller Flow**:
    - Add a product (stored in Supabase).
    - Verify it appears in the list.
    - Verify QR code is generated with a UUID.
2.  **Consumer Flow**:
    - Visit the generated URL (`/p/[uuid]`).
    - Verify data is fetched from Supabase.
    - Click "Review" and verify Amazon opens with the correct ASIN.
