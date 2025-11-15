# Vcyber - Deployment Guide

Complete guide to deploy your Vcyber video conferencing application to a VPS.

## 📋 Prerequisites

- VPS with Ubuntu 20.04+ or similar Linux distribution
- Domain name (optional but recommended)
- SSH access to your VPS
- Node.js 18+
- Git installed on VPS

---

## 🚀 Quick Deployment (VPS)

### Step 1: Connect to Your VPS

```bash
ssh user@your-vps-ip
```

### Step 2: Install Node.js

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 3: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### Step 4: Clone the Repository

```bash
cd /home/user
git clone https://github.com/ndducnha/conf.git vcyber
cd vcyber
```

### Step 5: Install Dependencies

```bash
npm install
```

### Step 6: Configure Environment Variables

Create the `.env.local` file:

```bash
nano .env.local
```

Add the following configuration (replace with your actual LiveKit credentials):

```env
# LiveKit Configuration
LIVEKIT_API_KEY=your_api_key_here
LIVEKIT_API_SECRET=your_api_secret_here
LIVEKIT_URL=wss://your-project.livekit.cloud

# Optional: Enable settings menu
# NEXT_PUBLIC_SHOW_SETTINGS_MENU=true
```

Save and exit (Ctrl+X, then Y, then Enter).

### Step 7: Build the Application

```bash
npm run build
```

### Step 8: Start the Application with PM2

```bash
pm2 start npm --name "vcyber" -- start
pm2 save
pm2 startup
```

The app will now be running on port 3000.

### Step 9: Configure Nginx (Reverse Proxy)

Install Nginx:

```bash
sudo apt update
sudo apt install nginx
```

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/vcyber
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    location / {
        proxy_pass http://localhost:3000;
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

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/vcyber /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 10: Configure Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

### Step 11: Setup SSL with Let's Encrypt (Recommended)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Follow the prompts to complete SSL setup.

---

## 🔄 Updating Your Application

When you push updates to GitHub, deploy them with:

```bash
cd /home/user/vcyber
git pull origin main
npm install
npm run build
pm2 restart vcyber
```

---

## 📊 PM2 Management Commands

### View Application Status

```bash
pm2 status
```

### View Logs

```bash
pm2 logs vcyber
```

### Restart Application

```bash
pm2 restart vcyber
```

### Stop Application

```bash
pm2 stop vcyber
```

### Remove Application

```bash
pm2 delete vcyber
```

---

## 🌐 Alternative: Deploy to Vercel (Easiest)

For the simplest deployment with automatic HTTPS and CDN:

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

```bash
cd /path/to/vcyber
vercel
```

### Step 4: Add Environment Variables

In the Vercel dashboard:

1. Go to your project settings
2. Navigate to Environment Variables
3. Add:
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
   - `LIVEKIT_URL`

### Step 5: Redeploy

```bash
vercel --prod
```

**Benefits of Vercel:**

- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Automatic deployments on git push
- ✅ Free for most use cases
- ✅ Zero configuration needed

---

## 🔧 Troubleshooting

### Port 3000 Already in Use

```bash
# Find process using port 3000
sudo lsof -i :3000
# Kill the process
sudo kill -9 <PID>
```

### Application Won't Start

```bash
# Check logs
pm2 logs vcyber
# Check environment variables
cat .env.local
```

### Nginx Configuration Error

```bash
# Test configuration
sudo nginx -t
# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Can't Join Meeting Rooms

- Verify LiveKit credentials in `.env.local`
- Check that LiveKit URL is correct (should start with `wss://`)
- Ensure firewall allows outbound WebSocket connections

---

## 📝 System Requirements

- **Minimum**: 1 CPU, 1GB RAM, 10GB storage
- **Recommended**: 2 CPU, 2GB RAM, 20GB storage
- **Node.js**: Version 18 or higher
- **Ports**: 80 (HTTP), 443 (HTTPS), 3000 (App)

---

## 🔐 Security Checklist

- ✅ Use HTTPS (SSL certificate)
- ✅ Keep `.env.local` secure (never commit to git)
- ✅ Enable firewall
- ✅ Keep Node.js and npm updated
- ✅ Regularly update dependencies: `npm update`
- ✅ Use strong passwords for VPS
- ✅ Enable SSH key authentication

---

## 📞 Support

For LiveKit-specific issues, visit: https://docs.livekit.io

For deployment issues, check:

- Application logs: `pm2 logs vcyber`
- Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- System logs: `journalctl -xe`

---

## 🎉 Congratulations!

Your Vcyber video conferencing application is now live!

Access it at: `http://your-domain.com` or `https://your-domain.com` (if SSL is configured)
