# DEBEST Stationaries

A full-stack stationery e-commerce MVP built with Next.js, TypeScript, Tailwind CSS and Supabase.

## Current implementation
- Responsive storefront
- Product search and category filtering
- Product detail pages
- Local shopping cart
- Google OAuth entry point through Supabase Auth
- Checkout form
- Server-side order validation and creation
- Supabase schema and seed products
- Order success page
- Environment variable template

## Setup
1. Install Node.js 20+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and add your Supabase values.
4. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.
5. In Supabase Auth, enable Google and add your Google OAuth client ID/secret.
6. Configure Google Cloud Console OAuth consent screen and redirect URI using the Supabase Auth callback URL shown in the Supabase dashboard.
7. Run `npm run dev`.

## Mailgun
The order API is structured for server-side transactional email. Add Mailgun credentials to `.env.local` and wire the Mailgun send call into the successful order path before production use.

## Important
This is an MVP starter. Before production deployment, add transactional order creation/stock updates in a database transaction or RPC, implement the Mailgun send, tighten RLS and add automated tests.
