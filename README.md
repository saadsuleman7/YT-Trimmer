# YT-Trimmer

A full-stack SaaS platform for downloading and trimming videos using yt-dlp. Features a freemium model with guest access, free accounts, and premium subscriptions.

## Features

### Core
- **Video Download & Trim** - Paste a URL, set trim points, choose format (MP4/MP3) and quality
- **Built-in Video Player** - Preview videos before downloading
- **Smart Trimming** - Dual slider + manual time input (HH:MM:SS)
- **Format Selection** - MP4 video or MP3 audio extraction

### User Tiers
| Feature | Guest | Free (Logged In) | Premium |
|---------|-------|-------------------|---------|
| Max Quality | 720p | 720p | 4K |
| Max FPS | 24fps | 24fps | 60fps+ |
| MP4 & MP3 | Yes | Yes | Yes |
| Trimming | Yes | Yes | Yes |
| Download History | No | Yes | Yes |
| Account Settings | No | Yes | Yes |

### Premium Plans
- **Weekly**: $2/week
- **Monthly**: $6/month (best value)
- **Payment Methods**: Stripe (auto), PayPal, Crypto, Easypaisa, Bank Transfer (manual)

### Pages
- Home, Download Tool, Pricing, Reviews, About, Owners, Contact
- Login, Signup, Account Settings
- Terms of Service, Privacy Policy
- Full Admin Panel

### Admin Panel
- Dashboard with KPI metrics (users, downloads, revenue, ratings)
- Analytics: downloads by quality/format, daily trends, top countries
- User management: search, ban/unban, upgrade, role assignment
- Payment management: approve/reject manual payments, view proofs
- Review moderation: approve, hide, manage visibility
- Download logs: detailed history with video info

### Design
- **Yellow gradient theme** with dark/light mode toggle
- Responsive layout with Tailwind CSS
- Smooth animations and transitions
- Clean, modern UI with rounded components and soft shadows

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, React Router, Axios, React Toastify
- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Auth**: JWT, bcrypt, role-based access control
- **Payments**: Stripe API + manual payment workflow
- **Video Processing**: yt-dlp + ffmpeg
- **Security**: Helmet, CORS, rate limiting, input sanitization

## Setup

### Prerequisites
- Node.js 18+
- MongoDB
- yt-dlp
- ffmpeg

### Installation

```bash
# Install all dependencies
npm run install-all

# Configure environment
cp server/.env.example server/.env
# Edit server/.env with your values

# Run development servers
npm run dev
```

### Environment Variables

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/yt-trimmer
JWT_SECRET=your_secret_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLIENT_URL=http://localhost:3000
```

## API Routes

### Auth
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/settings` - Update settings

### Videos
- `POST /api/videos/metadata` - Fetch video metadata

### Downloads
- `POST /api/downloads/start` - Start download
- `GET /api/downloads/file/:filename` - Get file
- `GET /api/downloads/history` - User download history

### Ratings
- `POST /api/ratings` - Submit rating
- `GET /api/ratings` - Get approved ratings

### Payments
- `POST /api/payments/create-checkout` - Stripe checkout
- `POST /api/payments/manual` - Manual payment
- `GET /api/payments/methods` - Available methods

### Admin
- `GET /api/admin/dashboard` - Dashboard metrics
- `GET /api/admin/users` - List users
- `PUT /api/admin/users/:id/ban` - Ban/unban user
- `PUT /api/admin/users/:id/upgrade` - Upgrade user
- `GET /api/admin/payments` - List payments
- `PUT /api/admin/payments/:id/approve` - Approve payment
- `PUT /api/admin/payments/:id/reject` - Reject payment
- `GET /api/admin/reviews` - List reviews
- `PUT /api/admin/reviews/:id` - Moderate review
- `GET /api/admin/downloads` - Download logs

## License

MIT
