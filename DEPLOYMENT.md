# 🚀 Production Deployment Guide

This guide covers the top deployment options for the **Hospital Digital Platform**, including cloud hosting (Vercel + Render), Docker/VPS deployment, and hooking in **Vapi.ai** and **n8n**.

---

## 🌟 Option 1: Cloud Deployment (Vercel + Render / Railway) - *Recommended & Free Tier Ready*

### 1. Deploy the Backend on Render or Railway
1. Push your repository to GitHub / GitLab.
2. Go to [Render Dashboard](https://dashboard.render.com) -> **New Web Service**.
3. Select your repository and configure:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Set Environment Variables on Render:
   - `NODE_ENV`: `production`
   - `PORT`: `5001`
   - `JWT_SECRET`: `(generate a strong 32+ char random key)`
   - `FRONTEND_URL`: `https://your-hospital-frontend.vercel.app`
5. Click **Deploy**. Copy your Render backend URL (e.g. `https://hospital-api.onrender.com`).

---

### 2. Deploy the Frontend on Vercel or Netlify
1. Go to [Vercel Dashboard](https://vercel.com) -> **Add New Project**.
2. Select your repository and configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Click **Deploy**. Your hospital portal is now live with global CDN & free SSL!

---

## 🐳 Option 2: Docker & Docker Compose (DigitalOcean / AWS / Ubuntu VPS)

If you have a VPS (DigitalOcean Droplet, AWS EC2, Linode, or Hetzner):

1. Clone your repo onto the server:
   ```bash
   git clone <YOUR_REPO_URL>
   cd Hospital_management
   ```

2. Run both Frontend & Backend in containers with one command:
   ```bash
   docker compose up -d --build
   ```

3. Setup Nginx with Let's Encrypt SSL (Certbot):
   ```bash
   sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
   ```

---

## 📞 Option 3: Connecting Vapi.ai & n8n to Production

Once your backend is live at `https://your-api-domain.com`:

1. **Configure Vapi.ai Assistant**:
   - Go to [Vapi.ai Dashboard](https://dashboard.vapi.ai) -> Assistants -> Your Assistant.
   - Set **Server URL** to:
     ```
     https://your-api-domain.com/api/telephony/vapi/webhook
     ```
   - Make sure your tools match `vapi_assistant_config.json`.

2. **Configure n8n Webhook**:
   - In n8n, set `HOSPITAL_API_URL` to `https://your-api-domain.com`.
   - Activate the workflow and link incoming telephone events.

---

## 🔒 Production Environment Checklist

| Variable | Description |
| :--- | :--- |
| `NODE_ENV` | Must be `production` |
| `JWT_SECRET` | Strong 32+ character key for authentication tokens |
| `FRONTEND_URL` | Domain of the frontend for CORS whitelist |
| `GOOGLE_SHEETS_ID` | *(Optional)* ID of your Google Sheet for live sync |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | *(Optional)* Google Service Account email |
| `GOOGLE_PRIVATE_KEY` | *(Optional)* Google Service Account private key |
