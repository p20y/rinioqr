# Rinio QR - Project Documentation

## 1. Project Overview
**Rinio QR** is a web application designed for Amazon sellers to generate unique QR codes for their products. These QR codes serve as a direct bridge between physical products and digital engagement, specifically encouraging customers to leave reviews.

### Core Problem Solved
Sellers need a way to easily direct customers to the specific "Write a Review" page for their product on Amazon. Manual URL entry is prone to error and low conversion. Rinio QR automates this by creating a scan-to-review flow.

---

## 2. Technology Stack

We chose a modern, scalable, and cost-effective stack for this application:

*   **Frontend Framework**: [Next.js 14](https://nextjs.org/) (App Router) - For server-side rendering, routing, and React components.
*   **Language**: [TypeScript](https://www.typescriptlang.org/) - For type safety and better developer experience.
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) - For rapid, utility-first styling.
*   **UI Components**: [shadcn/ui](https://ui.shadcn.com/) - For accessible, premium-looking components (Buttons, Cards, Dialogs, Inputs).
*   **Database**: [Supabase](https://supabase.com/) (PostgreSQL) - For persistent storage of product data.
*   **QR Generation**: `qrcode.react` - For rendering SVG QR codes on the fly.
*   **Icons**: `lucide-react` - For consistent iconography.

---

## 3. Architecture & Data Flow

The application is built with a few key routes:

### A. Seller Dashboard (`/seller`)
*   **Purpose**: The command center for sellers.
*   **Functionality**:
    *   **Add Product**: Input a Name and Amazon ASIN. Saved to Supabase.
    *   **List Products**: Fetches all products from the `products` table.
    *   **QR Generation**: Automatically generates a QR code linking to the app's consumer route (`/p/[uuid]`).
    *   **Management**:
        *   **Disable/Enable**: Toggles the product's active state.
        *   **Delete**: Removes the product (with a modal confirmation).

### B. Consumer Page (`/p/[id]`)
*   **Purpose**: The destination page when a customer scans the QR code.
*   **Logic**:
    1.  **Fetch**: Queries Supabase for the product using the `id` from the URL.
    2.  **Check Status**:
        *   **If Active**: Displays a "Enjoying your purchase?" page with a big "Leave a Review" button.
        *   **If Disabled**: Automatically redirects the user to the Amazon **Product Page** (`amazon.in/dp/[ASIN]`).
    3.  **Action**: Clicking the button redirects the user to the Amazon **Review Page** (`amazon.in/review/create-review?asin=[ASIN]`).

### C. Database (Supabase)
We use a single table `products` with the following schema:
*   `id`: UUID (Primary Key)
*   `created_at`: Timestamp
*   `name`: Text (Product Name)
*   `asin`: Text (Amazon Standard Identification Number)
*   `is_active`: Boolean (Default: true)

---

## 4. Key Features Implemented

1.  **Dynamic QR Codes**: The QR code encodes a URL to *this* application, not Amazon directly. This allows us to change behavior (like disabling a link) without re-printing physical QR codes.
2.  **Stateless-ish Architecture**: While we use a database, the frontend is deployed as a standard Next.js app, making it easy to host on Vercel or Netlify.
3.  **Smart Redirection**:
    *   **Active**: Redirects to Review Page (High value action).
    *   **Disabled**: Redirects to Product Page (Safe fallback).
4.  **Premium UI**: Uses a clean, card-based interface with distinct colors (Orange for Amazon actions, Red for danger actions).

---

## 5. How to Run Locally

### Prerequisites
*   Node.js (v18+)
*   npm
*   Supabase Project URL & Anon Key

### Steps
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/p20y/rinioqr.git
    cd rinioqr
    ```

2.  **Install Application Dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env.local` file in the root:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

5.  **Open Browser**:
    Visit `http://localhost:3000`
