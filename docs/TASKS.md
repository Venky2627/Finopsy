# Finopsy Launch Roadmap

## Phase 0 & 1: Foundation
- [x] Repository foundation and shared contracts
- [x] Quick Add API, Demo, CSV/XLSX parser with review state
- [x] Dashboard, Autopsy UI, deterministic roast, and Share-card
- [ ] Environment separation (`.env.example`)
- [ ] API/model contract freeze

## Phase 2-9: Supabase Auth & Persistence
- [ ] Supabase project setup & PostgreSQL schema
- [ ] Row Level Security (RLS) policies
- [ ] Login / Logout UI (Google/Magic Link)
- [ ] Anonymous → Authenticated data migration
- [ ] Persistent transaction CRUD
- [ ] User profile (`@username`) & Personalized Share Card
- [ ] Settings & Data Deletion ("Nuke my data")

## Phase 10-14: Data Pipeline & Engine Polish
- [ ] PDF parser & Encrypted PDF handling
- [ ] Parser hardening & Categorization improvements
- [ ] Upload Review 2.0 (Mobile optimized)

## Phase 15+: Production Readiness
- [ ] Security audit & Upload limits
- [ ] Logging, Sentry Error Tracking, Health monitoring
- [ ] Automated Tests (Pytest) & E2E Golden Path
- [ ] Vercel/Render Staging & Production Deployment
