# Green Living

Green Living is a Next.js web app that helps users share eco-friendly actions, upload planting evidence, earn badges, and participate in a community forum.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Prisma ORM
- Supabase Postgres
- NextAuth (credentials-based authentication)
- Vercel Blob for image uploads
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
DATABASE_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres?schema=public"
DIRECT_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres?schema=public"
NEXTAUTH_SECRET="replace-with-a-strong-random-secret"
MAIN_ADMIN_EMAIL="admin@example.com"

# Required for Vercel Blob uploads
BLOB_READ_WRITE_TOKEN=""
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

## Deploy on Your Own Server (IP first, then domain)

This section gives a complete production workflow for Ubuntu 22.04/24.04.

### Phase 1: Make the app accessible via server IP

#### 1) Prepare the server

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx curl git ufw
```

Install Node.js 20 LTS:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Install PM2 to keep the app running:

```bash
sudo npm install -g pm2
```

#### 2) Upload and configure your project

```bash
git clone <your-repo-url>
cd Green-Living
npm install
cp .env.example .env   # or create .env manually if the file is missing
```

Edit `.env` and set production values. At minimum:

```env
DATABASE_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres?schema=public"
DIRECT_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres?schema=public"
NEXTAUTH_SECRET="your-very-long-random-secret"
MAIN_ADMIN_EMAIL="admin@yourmail.com"
NEXTAUTH_URL="http://YOUR_SERVER_IP"
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
```

Then build and prepare DB:

```bash
npx prisma migrate deploy
npm run build
```

#### 3) Run the app with PM2 on port 3000

```bash
pm2 start npm --name green-living -- start
pm2 save
pm2 startup
```

Check status/logs:

```bash
pm2 status
pm2 logs green-living
```

#### 4) Configure Nginx reverse proxy for server IP

Create config:

```bash
sudo nano /etc/nginx/sites-available/green-living
```

Paste:

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable config and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/green-living /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Open firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Now visit `http://YOUR_SERVER_IP`.

---

### Phase 2: Add your domain

#### 1) Point DNS to your server

At your domain registrar DNS panel, create:

- `A` record for `@` → `YOUR_SERVER_IP`
- `A` record for `www` → `YOUR_SERVER_IP`

Wait for DNS propagation (often a few minutes, sometimes longer).

#### 2) Update Nginx for domain

Edit:

```bash
sudo nano /etc/nginx/sites-available/green-living
```

Use:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

#### 3) Issue SSL certificate (HTTPS) with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Test auto-renew:

```bash
sudo certbot renew --dry-run
```

#### 4) Update app environment to domain

Update `.env`:

```env
NEXTAUTH_URL="https://yourdomain.com"
```

Then restart app:

```bash
pm2 restart green-living
```

---

### Updating your app later

Whenever you push new code:

```bash
cd Green-Living
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart green-living
```

### Quick troubleshooting checklist

- App not opening by IP/domain:
  - `pm2 status`
  - `pm2 logs green-living`
  - `sudo systemctl status nginx`
  - `sudo nginx -t`
- Domain not working:
  - Verify DNS A records point to your server IP.
- SSL issue:
  - Re-run certbot and ensure ports 80/443 are open.
- Login/session issue:
  - Ensure `NEXTAUTH_URL` matches your current public URL exactly.

## Downloadable Deployment File

If you want this as a separate downloadable file, use:

- `docs/DEPLOYMENT_GUIDE.md`


## Useful Commands

```bash
npm run lint        # Run ESLint
npx prisma studio   # Open Prisma Studio
```
