# SIRINX Project TODO

## Phase 1 — Completed
- [x] Basic homepage layout with dual theme
- [x] Navigation menu with SIRINX logo
- [x] About page
- [x] Solutions page (6 solutions)
- [x] Industries page (6 sectors)
- [x] Investment & Tax Hub page
- [x] Projects/Case Studies page
- [x] Blog/Insights page with category filtering
- [x] BlogPost detail page
- [x] Contact page with form
- [x] Solar Assessment wizard (1,857 lines engineering calculator)
- [x] Partner/Investor page
- [x] Strategy page
- [x] Upload 22+ real installation photos to CDN
- [x] Real company data: CEO Pitoon, address, phone, email
- [x] Solar Farm 2 Nodes: Royal Park + Holatel Rim Nan
- [x] Trust Badges in footer: DBD, Thailand Trust Mark, ISO 9001, BOI
- [x] 30-100% BESS update across all pages
- [x] AGENTS.md v4.0 Ultimate Codex Prompt
- [x] Blog HMR bug fix
- [x] Industries hero 403 fix
- [x] CDN URLs verified (26/28 OK)
- [x] TypeScript 0 errors, Runtime 0 errors

## Phase 2 — Full-Stack Upgrade (Current)
- [x] Upgrade to Full-Stack (web-db-user) with Database + Backend + Auth
- [x] Fix Home.tsx useAuth conflict from upgrade merge
- [x] Push initial database schema (users table)
- [x] Gallery with 22 marketing material images + lightbox + filter (already in Projects.tsx)
- [x] Create Database Schema: leads table for Lead Management
- [x] Create Database Schema: blog_posts table for Blog CMS
- [x] Create Database Schema: projects table for Project Portfolio
- [x] Create Database Schema: contact_submissions table
- [x] Create tRPC API routes for leads CRUD
- [x] Create tRPC API routes for blog posts CRUD
- [x] Create tRPC API routes for projects CRUD
- [x] Create tRPC API routes for contact form submissions
- [x] Create Admin Panel with DashboardLayout (role-based access)
- [x] Admin: Lead Management dashboard (view, status update, notes)
- [x] Admin: Blog CMS (create, edit, publish, draft)
- [x] Admin: Project Portfolio management (via Blog CMS pattern)
- [x] Admin: Contact submissions viewer
- [x] Add LINE OA button in Contact page (channel card + sidebar CTA + post-submit CTA)
- [x] LINE OA integration — button linked to LINE OA URL (webhook requires LINE Messaging API key)
- [x] Gallery route already exists at /projects
- [x] Write vitest tests for API routes (23 tests, all passing)
- [x] Save checkpoint after Full-Stack upgrade
- [x] Connect Contact form to tRPC backend (lead.submit) with loading state
- [x] Connect SolarAssessment form to tRPC backend (lead.submit with source=assessment)

## Phase 3 — Traffic Analytics & Measurement
- [x] Create DB Schema: page_views table for tracking page visits
- [x] Create DB Schema: events table for conversion/action tracking
- [x] Create tRPC API: public event tracking endpoint (pageview, click, form_submit, cta_click)
- [x] Create tRPC API: admin analytics queries (page views by date, top pages, referrers, conversions)
- [x] Frontend: Auto page-view tracking hook (fires on every route change)
- [x] Frontend: Event tracking utility (track CTA clicks, form submissions, LINE clicks)
- [x] Admin: Analytics Dashboard page with real charts (daily visitors, top pages, conversion funnel, lead source attribution)
- [x] Write vitest tests for analytics API routes (41 tests total, all passing)
- [x] Save checkpoint after Analytics feature

## Phase 4 — Meta Tags / OG Tags Fix
- [x] Fix Open Graph meta tags (og:title, og:description, og:image, og:url)
- [x] Fix Twitter Card meta tags (twitter:card, twitter:title, twitter:description, twitter:image)
- [x] Add proper meta description tag
- [x] Upload OG image to CDN and reference in meta tags
- [x] Add server-side OG tag injection for social media crawlers (per-route)
- [x] Save checkpoint after meta tags fix

## Phase 5 — OG Content SEO/AEO Optimization
- [x] Rewrite OG title/description to be marketing-focused SEO/AEO copy (not generic corporate description)
- [x] Update per-route metadata with keyword-rich promotional copy
- [x] Verify OG tags render correctly via curl test on production domain
- [x] Save checkpoint

## Phase 6 — LINE Popup Icon + AI Chatbot Widget
- [x] Create floating LINE popup icon (bottom-right corner) with bounce/pulse animation
- [x] Design chat widget UI with SIRINX branding (dark theme, cyan accent)
- [x] Add open/close animation (slide up from bottom-right)
- [x] Create AI chatbot backend (tRPC + LLM) with solar energy knowledge — Solar Carport flagship prompt updated
- [x] Add quick reply buttons (ขอใบเสนอราคา, นัดสำรวจหน้างาน, สอบถามราคา, etc.)
- [x] Add "ติดต่อผ่าน LINE" button in chat widget to redirect to LINE OA
- [x] Auto-show popup bubble message after 5 seconds to attract attention
- [x] Track chatbot interactions via analytics events
- [x] Write vitest tests for chatbot API (69 tests total, all passing)
- [x] Save checkpoint

## Phase 7 — Solar Carpark War Mode (Master Prompt Execution)

### DAY 1: Reposition & Home Redesign
- [x] Reposition site messaging: Solar Carpark as flagship product
- [x] Redesign Home hero: Solar Carpark proof image, new headline/subheadline
- [x] Update Home section order per Master Prompt (13 sections)
- [x] Update primary CTAs: ขอใบเสนอราคา Solar Carport, นัดสำรวจหน้างาน, ปรึกษาโครงการ
- [x] Add FAQ/AEO answer block to Home
- [x] Update navigation: add Solar Carport as prominent nav item
- [x] Create Asset Placement Map

### DAY 2: Solar Carpark Flagship Page
- [x] Create /solar-carport flagship page (B2B landing page style)
- [x] Solar Carport hero with real proof image
- [x] Value proposition, who it's for, process section
- [x] Integration section: EV Charger / ESS / monitoring / O&M
- [x] FAQ section with schema markup
- [x] Lead form + contact strip + sticky mobile CTA

### DAY 3: Projects & Portfolio Redesign
- [x] Redesign Projects page for proof-first storytelling
- [x] Add Solar Carport project category
- [x] Improve image aspect ratios and lightbox quality
- [x] Short captions only, preserve image quality

### DAY 4: Supporting Pages
- [x] Create O&M / Maintenance page (integrated into Solutions)
- [x] Upgrade Solutions page: Solar Carport as primary solution
- [x] Upgrade Industries page: Solar Carport framing per industry
- [x] Upgrade About page for premium consistency
- [x] Upgrade Financing/Investment page with financing-aware content

### DAY 5-6: SEO/AEO & Conversion
- [x] Update OG tags and meta for new Solar Carport pages
- [x] Add FAQ schema markup where appropriate
- [x] Strengthen internal linking across all pages
- [x] Improve conversion form logic (Solar Carport as default interest)
- [x] Update admin lead categories: Solar Carport primary, financing tag, EV-ready tag

### DAY 7: QA & Hardening
- [x] Responsive QA: desktop, tablet, mobile — verified no overflow, all images load, all links valid
- [x] CTA event tracking verification
- [x] Form submission test
- [x] Image modal/lightbox test — project cards with images render correctly
- [x] Mobile navigation test — mobile nav classes present, responsive grid/text confirmed
- [x] No overflow/broken layout on mobile — 5 minor overflow elements (chat widget, grid gap) none user-visible
- [x] Run all vitest tests and fix any failures (70 tests passing)
- [x] Save checkpoint and present preview

## Phase 8 — Second Pass Refinement (Solar Carpark Finalization)

- [x] P1: Make Solar Carport feel like clear flagship across whole site
- [x] P2: Improve Home hero and above-the-fold conversion clarity
- [x] P3: Strengthen proof-of-execution using real carport photos
- [x] P4: Improve Projects page — premium, not cluttered
- [x] P5: Improve O&M narrative using robot cleaning visual
- [x] P6: Improve integration narrative using rooftop + BESS visuals
- [x] P7: Improve financing pages for helpfulness and trust
- [x] P8: Improve local SEO pages — OG tags updated with Solar Carport focus
- [x] P9: Improve mobile readability of image-heavy sections
- [x] P10: Improve CTA rhythm across every important page
- [x] P11: Check image ratios, text spacing, section hierarchy
- [x] P12: Verify forms, tracking, metadata, mobile behavior
- [x] P13: Return updated preview + list of everything fixed

## Phase 9 — Multi-Product Hero Slideshow (10 images + Personalization)
- [x] Generate first 5 hero images (Carport Aerial, Carport Ground, Rooftop Factory, Floating Solar, Carport EV)
- [x] Generate remaining 5 hero images (BESS, Hotel Resort, Night Carport, AI Monitoring, Wide Carport) — regenerated 3 for realism
- [x] Build hero slideshow component with auto-rotation + smooth crossfade transitions
- [x] Add cookie/localStorage-based personalization (track which solution pages visitor browses)
- [x] Reorder hero slides based on visitor interest preferences
- [x] Integrate slideshow into Home page replacing single hero image
- [x] Add preference tracking to all solution/industry pages (SolarCarport, Solutions, Industries)
- [x] Test slideshow on desktop and mobile — 70 tests pass, screenshot verified
- [x] Write vitest tests for HeroSlideshow personalization (13 tests, 83 total)
- [x] Save checkpoint (version 6cf6ac83)

## Phase 10 — Pricing Packages Page (Size S, M, L)
- [x] Research Thai solar carport/rooftop pricing for S, M, L packages
- [x] Design Pricing page with 3 package tiers (S, M, L) + custom/enterprise CTA
- [x] Include: kW capacity, estimated savings, ROI period, what's included per package
- [x] Size L+ (custom): show "ติดต่อทีมงาน" with self-assessment form for capacity needs
- [x] Add /pricing route and navigation link
- [x] Integrate package selection with contact form (prefill interest + package size)
- [x] Write vitest tests for pricing page (21 tests, 104 total)
- [x] Save checkpoint

### Phase 10 Additional — EV Readiness + Government Policy
- [x] Research Thai government EV support policies (EV 3.5, BOI, tax incentives 2025-2026)
- [x] Highlight Solar Carport EV readiness: รองรับ EV ที่เพิ่มขึ้นจากมาตรการรัฐ
- [x] Add government policy benefits section to Pricing page
- [x] Add comparison of Solar Carport vs traditional parking (revenue, shade, EV, property value)

## Phase 11 — Pricing Enhancements + Multi-Language + Executive Report

### 11A: Pricing Page Images
- [x] Search/generate realistic Solar Carport images for Size S, M, L packages
- [x] Upload images to CDN and integrate into Pricing page package cards
- [x] Ensure images are responsive and properly sized

### 11B: Interactive ROI Calculator
- [x] Build ROI calculator component with input fields (monthly electricity bill, parking spaces)
- [x] Calculate and display: estimated savings, payback period, 25-year total savings
- [x] Add visual chart/progress bar for ROI visualization
- [x] Integrate calculator into Pricing page

### 11C: Multi-Language System (TH/EN/CN)
- [x] Create language context/provider with TH/EN/CN support
- [x] Add language switcher button in navbar (prominent, accessible)
- [x] Translate navbar + footer labels (TH/EN/CN) with 100+ translation keys
- [x] Persist language preference in localStorage

### 11D: Executive System Report + Timeline
- [x] Compile full project timeline from Phase 1 to Phase 11
- [x] Write executive System Report with metrics, features, architecture
- [x] Format as professional PDF document for management presentation

## Phase 12 — Full-Stack Code Audit & Final Roadmap
- [x] Audit server-side: schema, routers, db, storage, tests
- [x] Audit client-side: all 16 pages, 9 components, contexts, hooks
- [x] Audit configuration: CSS, i18n, SEO/OG, marketing content
- [x] Run full test suite + TypeScript check + browser QA (0 TS errors, 104 tests)
- [x] Fix critical issues: Partner form, Layout links, Contact inputs, Legal ref, DB perf, Blog form, HMR fix
- [x] Compile Final Audit Report with development roadmap

## Phase 13 — Real Photos + Rebuild i18n System

### 13A: Upload Real Solar Carport Photos
- [x] Upload 17 real Solar Carport photos from Royal Park to CDN (16 uploaded, all on CDN)
- [x] Categorize photos: BESS (2), Carport Structure (5), Carport Underside (4), Installation Team (2), Pillar (1), Detail (2)
- [x] Replace AI-generated images with real photos on Home page (Node 1 section)
- [x] Replace AI-generated images with real photos on Solar Carport page
- [x] Replace AI-generated images with real photos on Projects page
- [x] Create real project photo gallery section (12 photos in SolarCarport + 20 in Projects)

### 13B: Rebuild i18n System
- [x] Rebuild i18n system with per-page translation files (TH/EN/CN)
- [x] Convert all hardcoded Thai text in Home.tsx to translation keys
- [x] Convert all hardcoded Thai text in Pricing.tsx to translation keys
- [x] Convert all hardcoded Thai text in SolarCarport.tsx to translation keys
- [x] Convert all hardcoded Thai text in Solutions.tsx to translation keys
- [x] Convert all hardcoded Thai text in Industries.tsx to translation keys
- [ ] Convert all hardcoded Thai text in InvestmentTaxHub.tsx to translation keys
- [x] Convert all hardcoded Thai text in Contact.tsx to translation keys
- [ ] Convert all hardcoded Thai text in About.tsx to translation keys
- [x] Convert all hardcoded Thai text in Projects.tsx to translation keys
- [ ] Convert all hardcoded Thai text in Blog.tsx to translation keys
- [ ] Convert all hardcoded Thai text in Assessment.tsx to translation keys
- [ ] Test language switching TH→EN→CN on all pages
- [ ] Save checkpoint

## Phase 14 — Anti-Copy Protection + White-Label Architecture

### 14A: Anti-Copy Coding Protection System
- [ ] Research anti-copy techniques: code obfuscation, right-click disable, DevTools detection, watermarking
- [ ] Implement client-side copy protection (disable right-click, text selection, keyboard shortcuts)
- [ ] Implement DevTools detection and warning system
- [ ] Add JavaScript code obfuscation to production build
- [ ] Add dynamic watermarking system (invisible + visible options)
- [ ] Add license verification / domain-lock system
- [ ] Write documentation on anti-copy protection measures

### 14B: White-Label Architecture (Multi-Brand Reusable System)
- [ ] Research white-label SaaS architecture patterns and best practices
- [ ] Design Brand Abstraction Layer (colors, logos, fonts, content per brand)
- [ ] Design Config-driven architecture (brand.config.ts pattern)
- [ ] Create White-Label Architecture Document with diagrams
- [ ] Implement brand configuration system (theme, content, assets)
- [ ] Create example second-brand config to prove reusability
- [ ] Write deployment guide for new brand onboarding
- [ ] Save checkpoint

## Phase 15 — Replace AI Images in Projects with Realistic Generated Photos
- [x] Generate realistic Floating Solar photo (solar panels on water reservoir, agricultural setting)
- [x] Generate realistic Rooftop+BESS resort photo (solar panels on seaside resort roof)
- [x] Generate realistic Rooftop Solar warehouse photo (large solar panels on warehouse/distribution center roof)
- [x] Upload generated images to CDN (5 images: floating, resort, warehouse, farm, Nan construction)
- [x] Replace AI image URLs in Projects.tsx for Floating Solar project
- [x] Replace AI image URLs in Projects.tsx for Resort project
- [x] Replace AI image URLs in Projects.tsx for Warehouse project
- [x] Also replaced: Holatel Nan construction, Farm BESS, SolarAssessment site photos
- [x] Verify all project cards show appropriate realistic images
- [x] Added isRendering flag: "ภาพจำลอง" (amber) vs "ผลงานจริง" (green) badges on project cards
- [ ] Save checkpoint (pending)

## Phase 16 — Full i18n System (TH/EN/CN) for All Pages
- [x] Create i18n infrastructure: translation files per page, LanguageContext, useTranslation hook
- [x] Translate Layout (Navbar + Footer) to TH/EN/CN (already done in Phase 11C)
- [x] Translate Home.tsx to TH/EN/CN (+ HeroSlideshow)
- [x] Translate SolarCarport.tsx to TH/EN/CN
- [x] Translate Solutions.tsx to TH/EN/CN
- [x] Translate Industries.tsx to TH/EN/CN
- [x] Translate Pricing.tsx to TH/EN/CN
- [x] Translate Projects.tsx to TH/EN/CN
- [x] Translate Contact.tsx to TH/EN/CN
- [ ] Translate SolarAssessment.tsx to TH/EN/CN
- [ ] Translate About.tsx to TH/EN/CN
- [ ] Translate Blog.tsx to TH/EN/CN
- [ ] Translate InvestmentTaxHub.tsx to TH/EN/CN
- [ ] Translate Strategy.tsx to TH/EN/CN
- [ ] Translate Partner.tsx to TH/EN/CN
- [ ] Test language switching TH→EN→CN on all pages
- [ ] Save checkpoint

## Phase 17 — Product Hero Strategy + Full System Development Plan
- [x] Audit all current pages and their Product Hero status
- [x] Analyze which products have dedicated pages vs only mentioned
- [x] Create Product Hero Strategy document (docs/PRODUCT_HERO_STRATEGY.md)
- [x] Create Phase Roadmap for full system development (Phase A-E)
- [x] Identify gaps: 5 products need dedicated pages, 11 pages need i18n
- [x] Ensure plan doesn't conflict: Product Page Factory pattern, additive only

## SEO Fixes
- [x] SEO: Reduce homepage keywords from 17 to 7 focused keywords (Solar Carport, โซลาร์เซลล์, BESS, AI Energy, EV Charger, ลดค่าไฟ, SIRINX)
- [x] SEO: Shorten meta description from 192 to 135 chars + fix 5 other pages exceeding 160 chars

## Phase 18 — Reorder Pricing Tiers: Start / Pro / Enterprise
- [x] Reorder pricing tiers from Size S / M / L to Start / Pro / Enterprise
- [x] Fix pricing.ts: add registerPageTranslations + import in Pricing.tsx (was dead code)
- [x] Update pricing.ts i18n keys to match new tier IDs (start, pro, enterprise)
- [x] Update Pricing.tsx packageConfigs to Start / Pro / Enterprise with new names, IDs, and content
- [x] Update comparison table headers and data for new tier names
- [x] Remove separate Custom/Enterprise CTA section (merged into Enterprise tier)
- [x] Update ROI calculator recommended package names
- [x] Verify all translations work correctly (TH/EN/CN)
- [x] Update ogTags.ts SEO title from Size S/M/L to Start/Pro/Enterprise
- [x] Update Contact.tsx packageLabels mapping
- [x] Update LanguageContext.tsx global pricing title
- [x] Update Pricing.test.tsx — 124 tests all passing
- [x] Save checkpoint

## Phase 19 — Mobile Navigation Rebuild + Skill Creation

### 19A: Mobile Navigation Rebuild
- [x] Redesign mobile hamburger menu — cleaner, more modern layout
- [x] Make "ประเมินโซลาร์" (Solar Assessment) button prominent and easy to find on mobile
- [x] Improve mobile nav visual hierarchy — reduce clutter, better spacing
- [x] Collapse sub-items (โซลูชัน dropdown) more elegantly on mobile
- [x] Add visual accents and icons to key CTA buttons on mobile
- [x] Test mobile nav on browser (mobile viewport)
- [x] Save checkpoint

### 19B: Create Pricing Tier Restructure Skill
- [x] Create skill using skill-creator workflow
- [x] Write SKILL.md with reusable pricing restructure process
- [x] Add reference checklist for all files to update
- [x] Validate skill
- [x] Deliver skill to user

## Phase 20 — Fix SolarAssessment ReferenceError
- [x] Fix ReferenceError: t is not defined in SolarAssessment.tsx
- [x] Verify /assessment page loads without errors — 0 TS errors, 124 tests pass
- [x] Save checkpoint

## Phase 21 — Royal Park Portfolio / Case Study Page
- [x] Upload 16 new photos + 2 PDF datasheets to CDN
- [x] Fix projects.ts i18n registration (registerPageTranslations)
- [x] Add 16 new photos to gallery section in Projects.tsx (total 36 photos)
- [x] Add Equipment section with AIKO Neostar 680W panel + GSL BESS 16kWh specs
- [x] Add PDF datasheet download links (AIKO Neostar + GSL Energy)
- [x] Rewrite projects.ts i18n with equipment translations (TH/EN/CN)
- [x] Verify page renders correctly in browser — featured project, cards, equipment, gallery all working
- [x] 0 TS errors, 124 tests pass
- [x] Save checkpoint

## Phase 22 — Professional Brochure/Quotation Images + AI Video + Website Integration

### 22A: Professional Brochure Images (Google Flow Layout Style)
- [x] Generate quotation brochure — Start Package (125,000 THB) with product images + specs
- [x] Generate quotation brochure — Pro Package (310,500 THB) with product images + specs
- [x] Generate product datasheet — AIKO Neostar 1U+ 680W Solar Panel
- [x] Generate product datasheet — GSL Energy 16.08kWh LiFePO4 BESS
- [x] Generate product datasheet — Solis SOLARATOR S6-EH3P Hybrid Inverter
- [x] Generate product datasheet — Lisiner R261L1 Liquid-Cooled ESS
- [x] Generate overview brochure — SIRINX Solar Solutions (all 4 products)

### 22B: AI Marketing Video
- [x] Generate reference images for video (engineer character + solar house scene)
- [x] Generate AI video clips for SIRINX solar marketing (3 clips: engineer intro, equipment close-up, aerial drone)
- [x] Add narration audio (Thai) — male voice, professional tone
- [x] Combine clips with BGM into final video (20s, 12MB, crossfade transitions)

### 22C: Website Integration
- [x] Upload all brochure images to CDN (5 brochures + 1 video to CDN)
- [x] Create Brochure/Downloads section on Pricing page (between FAQ and CTA)
- [x] Add brochure image gallery with download links + video player
- [x] Ensure all equipment specs match product_specs.md exactly
- [x] Run tests — 124 tests passing, 0 TS errors
- [ ] Save checkpoint

## Phase 23 — Custom Domain Binding (sirinx.co)
- [ ] Save checkpoint for publish
- [ ] Publish website
- [ ] Bind sirinx.co custom domain via Management UI
- [ ] Configure DNS at Squarespace to point to Manus hosting

## Phase 24 — Custom Notifications + Stripe Payment Integration

### 24A: Custom Notification System
- [ ] Set up notification settings in Management UI (Settings > Notifications)
- [ ] Create notification triggers for key events (new lead, contact form, assessment completion)
- [ ] Add in-app notification UI for admin dashboard (bell icon + notification panel)
- [ ] Integrate with notifyOwner() for real-time owner alerts
- [ ] Write vitest tests for notification system

### 24B: Stripe Payment Integration
- [ ] Add Stripe feature using webdev_add_feature
- [ ] Configure Stripe API keys via webdev_request_secrets
- [ ] Create product/service catalog (Solar Carport packages: Start, Pro, Enterprise deposits)
- [ ] Build payment page with Stripe Checkout integration
- [ ] Create payment success/cancel pages
- [ ] Add payment history to admin dashboard
- [ ] Create tRPC procedures for payment management
- [ ] Write vitest tests for Stripe integration
- [ ] Save checkpoint
