# Cloudflare Setup Guide — SIRINX Solar Energy

## Overview

| Component | Purpose | Plan Required |
|-----------|---------|--------------|
| DNS | Nameservers + records | Free |
| CDN | Global edge caching | Free |
| Workers | API proxy, SEO pages | Free (100k/day) → Paid |
| Pages | Static site hosting | Free |
| Image Resizing | WebP optimization | Pro ($20/mo) |
| KV Storage | SEO page cache | Free (1GB) |

---

## Step 1: เพิ่ม Domain ใน Cloudflare

1. ไปที่ [dash.cloudflare.com](https://dash.cloudflare.com) → **Add a Site**
2. พิมพ์ `sirinx.com` → **Continue**
3. เลือก plan (Free เริ่มต้นได้)
4. Cloudflare จะ scan DNS records เดิมให้อัตโนมัติ — ตรวจสอบว่าครบ
5. Copy nameservers ที่ได้ (เช่น `anya.ns.cloudflare.com`)
6. ไปที่ Domain Registrar (Namecheap / GoDaddy / etc.) → เปลี่ยน nameservers เป็นของ Cloudflare
7. รอ propagation 5 นาที – 24 ชั่วโมง

---

## Step 2: DNS Records ที่ต้องตั้ง

| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| A | `@` | `<Alibaba Cloud IP>` | Proxied (Orange) | Auto |
| A | `www` | `<Alibaba Cloud IP>` | Proxied (Orange) | Auto |
| A | `app` | `<Alibaba Cloud IP>` | Proxied (Orange) | Auto |
| A | `cdn` | `<Alibaba Cloud IP>` | Proxied (Orange) | Auto |
| A | `staging` | `<Staging Server IP>` | Proxied (Orange) | Auto |
| CNAME | `api` | `app.sirinx.com` | Proxied (Orange) | Auto |
| MX | `@` | `mail.sirinx.com` | DNS only (Gray) | Auto |
| TXT | `@` | `v=spf1 include:_spf.google.com ~all` | DNS only | Auto |

> **หมายเหตุ:** Records ที่เป็น "Proxied (Orange cloud)" จะถูกส่งผ่าน Cloudflare CDN
> Records ที่เป็น "DNS only (Gray cloud)" จะ bypass CDN (ใช้สำหรับ mail, FTP)

---

## Step 3: SSL/TLS Settings

ไปที่ **SSL/TLS** tab ใน Cloudflare dashboard:

### Encryption Mode
เลือก **Full (strict)**
- Cloudflare ↔ ผู้ใช้: HTTPS (Cloudflare cert)
- Cloudflare ↔ Alibaba Cloud: HTTPS (your server cert)

```
Cloudflare Dashboard → SSL/TLS → Overview → Full (strict)
```

### Edge Certificates
- **Always Use HTTPS**: ON (redirect HTTP → HTTPS)
- **Minimum TLS Version**: TLS 1.2
- **Opportunistic Encryption**: ON
- **TLS 1.3**: ON
- **Automatic HTTPS Rewrites**: ON

### HSTS (ตั้งหลัง confirm ว่า HTTPS ทำงานได้แล้ว)
```
SSL/TLS → Edge Certificates → HTTP Strict Transport Security (HSTS)
- Enable HSTS: ON
- Max Age: 6 months
- Include Subdomains: ON (ถ้า subdomain ทั้งหมดรองรับ HTTPS)
- Preload: ON (ต้องการ submit to HSTS preload list)
```

---

## Step 4: Page Rules แนะนำ

ไปที่ **Rules → Page Rules** (หรือใช้ Cache Rules ใน Rules tab ถ้าใช้ Cloudflare newer UI):

### Rule 1: Force HTTPS
- **URL**: `http://sirinx.com/*`
- **Setting**: Always Use HTTPS

### Rule 2: Cache Static Assets (30 วัน)
- **URL**: `sirinx.com/_next/static/*`
- **Settings**:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month

### Rule 3: Cache SEO Pages (1 ชั่วโมง)
- **URL**: `sirinx.com/solar/*`
- **Settings**:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 hour

### Rule 4: Bypass Cache สำหรับ API
- **URL**: `sirinx.com/api/*`
- **Setting**: Cache Level: Bypass

### Rule 5: Security สำหรับ Admin
- **URL**: `app.sirinx.com/settings*`
- **Setting**: Security Level: High

---

## Step 5: Security Settings

### Firewall Rules (ไปที่ Security → WAF)

**Block bad bots:**
```
(cf.client.bot) and not (cf.verified_bot_category in {"Search Engine Crawlers" "Monitoring & Analytics"})
```
Action: Block

**Rate limit API:**
```
(http.request.uri.path matches "^/api/") and (rate.limit > 100 per 1m per ip)
```
Action: Block (1 นาที)

### Security Level
```
Security → Settings → Security Level: Medium
```

### Bot Fight Mode
```
Security → Bots → Bot Fight Mode: ON
```

### DDoS Protection
- เปิดใช้งานอัตโนมัติใน Cloudflare — ไม่ต้องตั้งค่าเพิ่ม

---

## Step 6: Performance Settings

### Speed → Optimization
- **Auto Minify**: JS ✓ | CSS ✓ | HTML ✓
- **Brotli Compression**: ON
- **HTTP/2**: ON (อัตโนมัติ)
- **HTTP/3 (QUIC)**: ON
- **0-RTT Connection Resumption**: ON
- **Early Hints**: ON

### Caching → Configuration
- **Caching Level**: Standard
- **Browser Cache TTL**: 4 hours (Cloudflare จะ override per Page Rule)
- **Crawler Hints**: ON

---

## Step 7: Workers Setup

### 7.1 สร้าง KV Namespace สำหรับ SEO Cache

```bash
# สร้าง KV namespace
wrangler kv:namespace create SEO_CACHE

# ผลลัพธ์จะได้ id เช่น:
# id = "abc123def456..."

# สร้าง preview namespace ด้วย
wrangler kv:namespace create SEO_CACHE --preview
```

นำ `id` ที่ได้ไปใส่ใน `cloudflare/worker-seo-pages/wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "SEO_CACHE"
id = "abc123def456..."
preview_id = "preview_id_here..."
```

### 7.2 Login Wrangler

```bash
wrangler login
# เปิด browser → authorize Cloudflare account
```

### 7.3 Deploy Workers

```bash
# Deploy ทีละ worker
scripts\deploy-cloudflare.bat

# หรือ manual:
wrangler deploy --config cloudflare/worker-api-proxy/wrangler.toml
wrangler deploy --config cloudflare/worker-seo-pages/wrangler.toml
wrangler deploy --config cloudflare/worker-image-optimizer/wrangler.toml
```

---

## Step 8: Cloudflare Pages Deploy

### Option A: GitHub Integration (แนะนำ)
1. Cloudflare Dashboard → Pages → Create a project
2. Connect to Git → เลือก repository
3. Build settings:
   - Framework preset: Next.js (Static HTML Export)
   - Build command: `cd sirinx-app && npm run build`
   - Build output directory: `sirinx-app/out`
   - Root directory: `/` (leave empty)
4. Environment variables → เพิ่ม production env vars
5. Save and Deploy

### Option B: Manual Deploy

```bash
# Build Next.js
cd sirinx-app
npm run build

# Deploy to Pages
cd ..
scripts\deploy-pages.bat
# หรือ:
wrangler pages deploy sirinx-app/out --project-name sirinx-solar-pages
```

---

## Step 9: Custom Domain สำหรับ Pages

1. Pages → sirinx-solar-pages → Custom domains
2. Add domain: `sirinx.com`
3. Cloudflare จะตั้ง DNS record ให้อัตโนมัติ
4. Add `www.sirinx.com` ด้วย

---

## Checklist หลัง Setup

- [ ] Nameservers เปลี่ยนเป็นของ Cloudflare
- [ ] SSL/TLS Mode = Full (strict)
- [ ] Always Use HTTPS = ON
- [ ] Workers deployed (api-proxy, seo-pages, image-optimizer)
- [ ] KV namespace สร้างแล้ว และ id ใส่ใน wrangler.toml แล้ว
- [ ] Pages project สร้างแล้ว
- [ ] Custom domain ผูกกับ Pages แล้ว
- [ ] Page Rules ตั้งค่าแล้ว
- [ ] Bot Fight Mode = ON
- [ ] ทดสอบ `https://sirinx.com/solar/bangkok` → เห็น HTML
- [ ] ทดสอบ `https://sirinx.com/api/health` → `{"status":"ok"}`
- [ ] ทดสอบ `https://cdn.sirinx.com/img?url=...&w=800&f=webp` → รูปภาพ WebP
- [ ] ทดสอบ `https://sirinx.com/sitemap.xml` → XML sitemap
- [ ] ตรวจสอบ PageSpeed Insights หลัง CDN เปิด

---

## Monitoring

- **Cloudflare Analytics**: dash.cloudflare.com → sirinx.com → Analytics
- **Worker logs**: `wrangler tail sirinx-api-proxy`
- **KV storage**: `wrangler kv:key list --namespace-id <id>`
- **Pages deployments**: dash.cloudflare.com → Pages → sirinx-solar-pages

---

## ค่าใช้จ่าย (โดยประมาณ)

| Service | Free Tier | Paid |
|---------|-----------|------|
| DNS + CDN | ฟรี | - |
| Workers | 100k req/day | $5/mo (10M req) |
| KV Storage | 100k reads/day, 1k writes/day | $0.50/million |
| Pages | ฟรี (500 deploys/mo) | - |
| Image Resizing | ไม่มี Free tier | Pro plan $20/mo |

> สำหรับ SIRINX เริ่มต้นด้วย Free tier + Workers Paid ($5/mo) เพียงพอสำหรับ launch
