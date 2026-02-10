# VibeCheck Project Context

## 1. Core Stack
- **Frontend:** React (Vite) + TypeScript + styled-components.
- **Backend:** Node.js + Express + TypeScript + Mongoose.
- **State:** React Context (No Redux).
- **Styling:** Theming via `styled-components` (no inline styles).

## 2. Architecture Constraints
- **Monorepo:** Keep /backend and /frontend distinct.
- **API Patterns:**
  - All routes wrapped in `asyncHandler`.
  - Standard JSON response: `{ success: boolean, data: any, error?: string }`.
- **Security:**
  - Rate limiting on all POST endpoints.
  - Honeypot fields on all public forms.
  - HMAC verification for Magic Links.

## 3. Key Feature Logic
- **Heatmaps:** Pre-calculate in MongoDB Aggregation (Day x Hour), do not loop in Node.js.
- **Tipping:** Pass-through logic only (UPI/PayPal intent links). No payment processing.
- **Multi-Store:** All analytics queries MUST filter by `storeId` or `tenantId`.

## 4. Testing Standards
- Backend: Jest (Unit + Integration).
- Frontend: Vitest.
