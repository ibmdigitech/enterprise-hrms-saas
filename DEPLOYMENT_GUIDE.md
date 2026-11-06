# HRMS SaaS - Deployment & Setup Guide

## 📋 Prerequisites

- **Node.js** ≥ 20.x
- **PostgreSQL** ≥ 14 (or Docker)
- **pnpm** or **npm** (package manager)

---

## 🚀 Local Development Setup

### 1. Clone & Install

```bash
cd saas-repo
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Required `.env` variables:**

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/hr_system"
DIRECT_URL="postgresql://user:password@localhost:5432/hr_system"

# NextAuth
AUTH_SECRET="generate-with: openssl rand -base64 32"
AUTH_TRUST_HOST=true
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Microsoft Entra ID (optional)
MICROSOFT_CLIENT_ID=""
MICROSOFT_CLIENT_SECRET=""
MICROSOFT_TENANT_ID="common"
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run postinstall

# Push schema to database
npm run db:push

# Seed initial data (optional)
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

App runs at: **http://localhost:3000**

---

## 🐳 Docker Deployment

### 1. Build Image

```bash
docker build -t hrms-saas .
```

### 2. Run with Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: hr_admin
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: hr_system
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5434:5432"

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://hr_admin:postgres@postgres:5432/hr_system
      - DIRECT_URL=postgresql://hr_admin:postgres@postgres:5432/hr_system
      - AUTH_SECRET=${AUTH_SECRET}
      - NEXTAUTH_URL=https://your-domain.com
    depends_on:
      - postgres

volumes:
  postgres_data:
```

```bash
docker-compose up -d
```

---

## ☁️ Production Deployment (Vercel)

### 1. Push to Git

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-org/hrms-saas.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Import project in Vercel dashboard
2. Add environment variables:
   - `DATABASE_URL` (PostgreSQL connection string)
   - `DIRECT_URL` (same as DATABASE_URL for Vercel)
   - `AUTH_SECRET` (32-char random string)
   - `NEXTAUTH_URL` (your production URL)
   - OAuth credentials (if using Google/Microsoft)
3. Deploy

### 3. Database Migration

```bash
# Run on first deploy
npx prisma migrate deploy
```

---

## 🔧 Required Post-Deployment Setup

### 1. Create Super Admin

```bash
# Option A: Via seed script
npm run seed

# Option B: Manually via database
# Insert user with role: SUPER_ADMIN
```

Default super admin (from seed):
- Email: `superadmin@hrms.local`
- Password: `SuperAdmin@123`

### 2. Configure Company/Tenant

1. Login as Super Admin
2. Go to `/super-admin/companies/new`
3. Create company with:
   - Company name
   - Domain/slug
   - Admin user (will receive activation link)

### 3. Email/SMTP (Required for Activation Links)

Configure in `/settings` or environment:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="app-password"
EMAIL_FROM="HRMS <noreply@your-domain.com>"
```

### 4. OAuth Providers (Optional)

**Google:**
1. Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID
3. Authorized redirect: `https://your-domain.com/api/auth/callback/google`

**Microsoft Entra ID:**
1. Azure Portal → App Registrations
2. Redirect URI: `https://your-domain.com/api/auth/callback/microsoft-entra-id`
3. Copy Client ID, Secret, Tenant ID

---

## 🔐 Default Credentials (Development)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@hrms.local` | `SuperAdmin@123` |
| Admin | `admin@techsafe.com` | `Admin@123456` |

**⚠️ Change passwords immediately in production!**

---

## 📁 Project Structure

```
saas-repo/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Login, activation
│   ├── dashboard/         # Main dashboard
│   ├── employees/         # Employee management
│   ├── leaves/            # Leave management
│   ├── payroll/           # Payroll processing
│   ├── recruitment/       # Hiring pipeline
│   ├── super-admin/       # Platform admin
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Core libraries
│   ├── auth/             # Auth guards, permissions
│   ├── workflow/         # Business workflows
│   └── prisma.ts         # Prisma client
├── prisma/
│   └── schema.prisma     # Database schema
├── scripts/              # Utility scripts
└── public/               # Static assets
```

---

## 🛠️ Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run lint             # Run ESLint
npm run typecheck        # TypeScript check
npm run test             # Run tests

# Database
npm run db:push          # Push schema changes
npm run db:studio        # Open Prisma Studio
npm run db:migrate       # Run migrations

# Deployment
npm run build            # Production build
npm run start            # Start production server

# Utilities
npm run seed             # Seed database
node scripts/set-dev-password.cjs <email> <password>
node scripts/force-password-rotation.cjs --apply
```

---

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| `pg` module not found | `npm install pg @types/pg` |
| Prisma client out of sync | `npm run postinstall` |
| OAuth not working | Check redirect URLs match exactly |
| Activation links fail | Verify SMTP config, check spam folder |
| Build fails on types | Fix TypeScript errors in pre-existing files |

---

## 📝 Notes

- **Multi-tenant**: Each company is a separate tenant with data isolation
- **RBAC**: Role-based access control with permissions system
- **Audit**: All sensitive actions logged in `SecurityAuditLog`
- **Retention**: Employee records archived (not deleted) for compliance
- **Print**: Employee profiles have print-optimized layout (`Ctrl+P`)

---

*Generated: 2026-11-04*
*HRMS SaaS Platform*