# Mine

Personal second-brain. Ideas, reminders, wishlist. Single-user PWA.

```bash
npm install && npm run dev
```

## Env

```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
APP_PASSCODE=                # 12+ chars, mix of cases/digits/symbols
AUTH_SECRET=                 # openssl rand -base64 32
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_CONTACT=mailto:you@example.com
CRON_SECRET=                 # openssl rand -base64 32
SMART_MOTIVATING_HOUR_UTC=3  # 3 UTC ≈ 8:30am IST
SMART_MOTIVATING_EVERY_DAYS=4
HF_TOKEN=                    # optional; real embeddings if set
```

## Schema

Run `schema.sql`, `auth.sql`, `push.sql` from `supabase/`.

## Deploy

Vercel. Push, import, paste env. `vercel.json` handles cron.

## Stack

Next 16 · React 19 · Tailwind 4 · Supabase + pgvector · Groq · Web Push.
