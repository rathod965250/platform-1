# Aptitude Preparation Platform (MVP)

A modern, responsive web application for Indian students to practice and take aptitude tests for placement preparation.

## 🎉 Status: Database & Auth Fully Integrated!

✅ **Backend:** Supabase database live with 11 tables & seed data  
✅ **Frontend:** Integrated with Supabase client  
✅ **Authentication:** Login, Signup, OAuth working  
✅ **Security:** Row Level Security (RLS) active  
✅ **Ready to build:** Core features can now be implemented!

**📖 See [INTEGRATION_COMPLETE.md](./INTEGRATION_COMPLETE.md) for testing guide!**

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, React 18
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Authentication**: Supabase Auth (Email/Password + Google OAuth)
- **Charts**: Recharts
- **Icons**: Lucide React
- **PDF Generation**: jsPDF
- **Math Rendering**: KaTeX
- **Deployment**: Vercel

## Features

- ✅ Practice Mode with immediate feedback
- ✅ Test Mode with full-screen interface and auto-submit
- ✅ Company-specific test questions
- ✅ Admin panel for managing content
- ✅ Analytics dashboard with AI-powered insights
- ✅ Leaderboards (All Time, Weekly, Monthly)
- ✅ Profile management with dark mode
- ✅ SEO optimized

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. **Environment is already configured!** ✅
   - `.env.local` file created with Supabase credentials
   - Database tables created and seeded (5 categories, 21 subcategories)
   - Authentication configured

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

### Test the Integration

**See live database connection on homepage:**
- ✅ Green "Database Connected" badge
- ✅ 5 categories loaded from Supabase with icons

**Test authentication:**
1. Visit `/signup` to create an account
2. Login at `/login`
3. Access protected `/dashboard` route

**📖 Full testing guide:** [INTEGRATION_COMPLETE.md](./INTEGRATION_COMPLETE.md)

---

## Manual Setup (Not Required)

The database and environment are already configured. If needed for reference:

```env
# Already configured in .env.local
NEXT_PUBLIC_SUPABASE_URL=https://rscxnpoffeedqfgynnct.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[configured]

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Project Structure

```
platform/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── (auth)/       # Authentication pages
│   │   ├── (student)/    # Student dashboard and features
│   │   ├── (admin)/      # Admin panel
│   │   └── api/          # API routes
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── auth/         # Authentication components
│   │   ├── practice/     # Practice mode components
│   │   ├── test/         # Test mode components
│   │   ├── results/      # Results and analytics components
│   │   ├── dashboard/    # Dashboard components
│   │   ├── profile/      # Profile components
│   │   ├── admin/        # Admin panel components
│   │   └── shared/       # Shared components
│   ├── lib/              # Utility functions
│   │   ├── supabase/     # Supabase client utilities
│   │   └── validations/  # Zod validation schemas
│   ├── store/            # Zustand stores
│   └── types/            # TypeScript type definitions
├── supabase/             # Supabase migrations and functions
│   ├── migrations/       # Database migrations
│   └── functions/        # Edge functions
└── public/               # Static assets
```

## Database Schema

The application uses Supabase (PostgreSQL) with the following main tables:

- `profiles` - User profiles and settings
- `categories` - Main aptitude categories
- `subcategories` - Subcategories for each category
- `tests` - Test definitions
- `questions` - Question bank
- `practice_sessions` - Practice session records
- `test_attempts` - Test attempt records
- `user_analytics` - User performance analytics
- `leaderboard` - Leaderboard rankings

## Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
```

### Adding shadcn/ui Components

```bash
npx shadcn@latest add <component-name>
```

## Deployment

The application is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy

## Contributing

This is an MVP project. Contributions are welcome!

## License

MIT

## Support

For support, email support@yourplatform.com
