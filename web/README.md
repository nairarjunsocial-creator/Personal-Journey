# Personal Journal (web app)

See the [repository README](../README.md) for local dev and GitHub Pages deployment.

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

## Environment variables

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-or-publishable-key>
```

For GitHub Pages, set these as repository secrets (not in `.env` on the server).

## Supabase

- **Database:** run `supabase/schema.sql`
- **Writes:** deploy `supabase/functions/diary-mutate` and set secret `DIARY_WRITE_PASSWORD`
- **Photos:** create public Storage bucket `covers`
