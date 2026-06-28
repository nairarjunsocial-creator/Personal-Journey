# Personal Journal

A personal diary built with React, Vite, and Supabase.

## Live site (GitHub Pages)

After setup, the site is published at:

**https://&lt;your-github-username&gt;.github.io/Personal-Journey/**

## Local development

```bash
cd web
cp .env.example .env
# Edit .env with your Supabase URL and anon key
npm install
npm run dev
```

Open http://localhost:5173

## GitHub Pages setup

### 1. Push this repo to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/Personal-Journey.git
git push -u origin main
```

### 2. Enable GitHub Pages

In the repo on GitHub:

1. **Settings** → **Pages**
2. **Build and deployment** → Source: **GitHub Actions**

### 3. Add repository secrets

**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Value |
|--------|--------|
| `VITE_SUPABASE_URL` | `https://<project>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your anon / publishable key |

Push to `main` (or re-run the **Deploy to GitHub Pages** workflow). The site updates automatically.

### 4. Supabase backend (one-time)

1. Run `web/supabase/schema.sql` in the Supabase SQL editor
2. Create a public Storage bucket named `covers`
3. Deploy the Edge Function and set `DIARY_WRITE_PASSWORD`:

```bash
cd web
supabase functions deploy diary-mutate --no-verify-jwt --project-ref <your-project-ref>
```

Set `DIARY_WRITE_PASSWORD` in Supabase → Edge Functions → Secrets to match the password you choose in the app **Settings**.

### Repo name note

The workflow uses `VITE_BASE_PATH=/Personal-Journey/`. If your GitHub repo has a different name, update that value in `.github/workflows/deploy.yml`.

For a **user site** (`username.github.io` with no subpath), set `VITE_BASE_PATH` to `/` instead.
