# VibeCheck

A production-grade, white-label feedback platform for SMBs to collect NPS/CSAT feedback via QR codes, view analytics, and recover unhappy customers.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI

# Start development servers
npm run dev
```

### Seed Demo Data

```bash
cd backend
npm run seed
```

Demo credentials:
- Email: `demo@vibecheck.com`
- Password: `demo123`

## 📁 Project Structure

```
VibeCheck/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── config/         # Database & env config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, rate limit, validation
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── validators/     # Zod schemas
│   │   └── index.ts        # Entry point
│   └── package.json
├── frontend/                # React/Vite SPA
│   ├── src/
│   │   ├── api/            # API client
│   │   ├── components/     # Reusable components
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Route pages
│   │   └── styles/         # Theme & global styles
│   └── package.json
└── package.json             # Root workspace
```

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new tenant |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/me` | Get profile |
| POST | `/api/v1/submit` | Submit feedback |
| GET | `/api/v1/analytics/:tenantId` | Get analytics |
| GET | `/api/v1/qr/generate` | Generate QR code |
| GET | `/api/v1/forms/public/:tenantId` | Get active form |

## 🎨 Features

- **Dynamic Forms**: JSON-driven form schema with NPS, CSAT, text, and phone inputs
- **White-label Theming**: Per-tenant color customization
- **QR Code Generation**: Static and magic (signed) QR codes
- **Real-time Alerts**: WhatsApp notifications for low NPS
- **Analytics Dashboard**: ECharts heatmap + Recharts trend lines
- **Tipping Integration**: UPI and PayPal support for happy customers

## 🛠️ Technology Stack

- **Backend**: Node.js, Express, Mongoose, Zod, JWT
- **Frontend**: React, Vite, styled-components, Recharts, ECharts
- **Database**: MongoDB

## 📊 Database Models

- **Tenant**: Store/organization with theme config, tipping settings
- **Form**: JSON schema for feedback questionnaires
- **Response**: Customer submissions with NPS/CSAT metrics

## 🔒 Security

- JWT authentication for dashboard
- Rate limiting per IP and per OrderID
- Honeypot field for bot detection
- HMAC-signed magic QR links

## 📝 License

MIT
