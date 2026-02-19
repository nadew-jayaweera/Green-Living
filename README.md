# Green Living

Green Living is a Next.js web app that helps users share eco-friendly actions, upload planting evidence, earn badges, and participate in a community forum.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Prisma ORM
- SQLite (default local database)
- NextAuth (credentials-based authentication)
- Tailwind CSS

## Installation Guide

### 1) Prerequisites

Make sure you have the following installed:

- **Node.js 20+**
- **npm 10+**

Check your versions:

```bash
node -v
npm -v
```

### 2) Clone the repository

```bash
git clone <your-repo-url>
cd Green-Living
```

### 3) Install dependencies

```bash
npm install
```

### 4) Configure environment variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

If `.env.example` does not exist, create `.env` manually with:

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="replace-with-a-strong-random-secret"
MAIN_ADMIN_EMAIL="admin@example.com"

# Optional (required only for image uploads to Cloudinary)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

### 5) Set up the database

Run Prisma migrations:

```bash
npx prisma migrate deploy
```

(Optional) Seed demo data:

```bash
npm run seed
```

### 6) Start the development server

```bash
npm run dev
```

Then open:

- http://localhost:3000

## Build for Production

```bash
npm run build
npm run start
```

## Useful Commands

```bash
npm run lint        # Run ESLint
npx prisma studio   # Open Prisma Studio
```
