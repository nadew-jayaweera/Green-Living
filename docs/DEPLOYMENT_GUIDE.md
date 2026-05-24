# Green Living Deployment Guide (Downloadable)

Use this guide to deploy **Green Living** on your own Ubuntu server.

It is split into two phases as requested:
1. Access the site by **server IP** first.
2. Add your **domain + HTTPS** after that.

---

## 0) Quick values to prepare

Replace these placeholders before running commands:

- `YOUR_SERVER_IP` → your VPS public IP (example: `203.0.113.10`)
- `YOUR_DOMAIN` → your real domain (example: `greenliving.com`)
- `YOUR_EMAIL` → your real email for SSL notices
- `YOUR_REPO_URL` → your Git repository URL

---

## 1) Server setup (Ubuntu 22.04/24.04)

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

Install PM2 process manager:

```bash
sudo npm install -g pm2
```

---

## 2) Pull project and configure environment

```bash
git clone YOUR_REPO_URL
cd Green-Living
npm install
```

Create `.env` (if `.env.example` exists, copy it first):

```bash
cp .env.example .env
```

If no `.env.example`, create `.env` manually:

```env
DATABASE_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres?schema=public"
NEXTAUTH_SECRET="put-a-long-random-secret-here"
MAIN_ADMIN_EMAIL="admin@yourmail.com"
NEXTAUTH_URL="http://YOUR_SERVER_IP"

# Optional (only if you use Cloudinary upload)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

Prepare DB and build:

```bash
npm run build
```

The default `build` script now only runs Prisma generate and the Next.js production build. The first request to `/api/stats` creates the bootstrap admin user if the database is empty, which avoids a long Vercel build step.
 
---

## 3) Run app with PM2 (IP access phase)

```bash
pm2 start npm --name green-living -- start
pm2 save
pm2 startup
```

Check app process:

```bash
pm2 status
pm2 logs green-living
```

---

## 4) Configure Nginx reverse proxy for IP

Create Nginx site config:

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

Enable and reload:

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

Now test in browser:

- `http://YOUR_SERVER_IP`

If this opens, phase 1 is done ✅

---

## 5) Add domain (phase 2)

### 5.1 DNS records

At your domain provider, add:

- `A` record: host `@` → `YOUR_SERVER_IP`
- `A` record: host `www` → `YOUR_SERVER_IP`

Wait for propagation.

### 5.2 Update Nginx for domain

```bash
sudo nano /etc/nginx/sites-available/green-living
```

Use this server block:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN www.YOUR_DOMAIN;

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

Apply:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6) Enable HTTPS (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN -m YOUR_EMAIL --agree-tos --redirect
```

Test certificate renewal:

```bash
sudo certbot renew --dry-run
```

---

## 7) Final app URL update

Now switch app URL in `.env` from IP to domain:

```env
NEXTAUTH_URL="https://YOUR_DOMAIN"
```

Restart app:

```bash
pm2 restart green-living
```

---

## 8) Future update commands

```bash
cd Green-Living
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart green-living
```

---

## 9) Troubleshooting checklist

- App down:
  - `pm2 status`
  - `pm2 logs green-living`
- Nginx issue:
  - `sudo systemctl status nginx`
  - `sudo nginx -t`
- Domain not opening:
  - confirm DNS A records are correct
- SSL not active:
  - ensure ports `80` and `443` are open in firewall/security group
- Login/session issue:
  - verify `NEXTAUTH_URL` exactly matches your live URL

---

## Download notes

This file is saved in the repo at:

- `docs/DEPLOYMENT_GUIDE.md`

You can download it directly from your repository interface (GitHub/GitLab) or via raw file URL.
