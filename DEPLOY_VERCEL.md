# Deploying Mini E-Commerce API to Vercel

This guide explains how to deploy the `Mini E-Commerce API` to Vercel (serverless Node). It assumes your project is already in a Git repo and that you have a `vercel.json` (this project includes one).

---

## 1. Overview

- This project builds to `dist/` via `npm run build` (TypeScript -> JS).
- `vercel.json` is already configured to route `/api/*` to `dist/server.js`.
- Vercel will run your `build` command and then use the serverless function defined in `vercel.json`.

## 2. Preconditions

- Node.js >= 18 installed locally (match Vercel runtime).
- `npm install` executed locally.
- Confirm `vercel.json` exists at repository root and contains the route mapping to `dist/server.js`.
- Ensure `package.json` has `build` script (`npm run build`) that produces `dist/server.js`.

## 3. Required Environment Variables (set in Vercel Dashboard)

Add the following environment variables in your Vercel project settings (Environment > Environment Variables):

- `DATABASE_URL` (postgre connection string)
- `JWT_ACCESS_SECRET` (production secret, min 32 chars)
- `JWT_REFRESH_SECRET` (production refresh secret)
- `NODE_ENV=production`
- `PORT=3000` (optional; Vercel assigns ports automatically for functions)
- `ENABLE_SWAGGER=false` (recommended to disable on production)
- `BCRYPT_SALT_ROUNDS` (e.g., `12`)
- `CORS_ORIGIN` (set to your frontend origin)

Optional / conditional environment variables used by the project (set if used):
- `PAYMENT_SUCCESS_RATE`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`

Security note: Add secrets in the Vercel UI (not committed to repo). Do not push `.env` to Git.

## 4. Vercel Project Settings

- Framework Preset: `Other` (or leave automatic)
- Build Command: `npm run build`
- Output Directory: leave blank (we are using `vercel.json` routes to `dist/server.js`)
- Node Version: set to `18.x` in the Vercel project settings or via `engines` in `package.json`.

## 5. Deploying (via Git)

1. Push your repository to GitHub/GitLab/Bitbucket.
2. Connect the repository in the Vercel dashboard.
3. Configure the environment variables in Vercel.
4. Trigger a deployment (Vercel will run `npm run build`).

## 6. Deploying (via Vercel CLI)

Install Vercel CLI and deploy from your local machine:

```bash
npm i -g vercel
# login once
vercel login

# Build locally first (optional but recommended)
npm run build

# Deploy (interactive)
vercel

# Or deploy a production build non-interactively
vercel --prod --confirm
```

If you want the Vercel CLI to run the build step, skip the local build and just run `vercel --prod` (Vercel will run your configured build command).

## 7. Post-deploy Verification

- Visit the deployment URL provided by Vercel.
- Check health endpoint: `https://<your-deploy-url>/api/health`
- Check logs in Vercel dashboard if any runtime error occurs.

## 8. Common Gotchas

- Ensure `dist/server.js` is produced by `npm run build`. If not, check `tsconfig.json` and build script.
- Do not commit `.env` with secrets. Use Vercel UI for secrets.
- If you rely on long-running processes (sockets, background workers), Vercel serverless functions are ephemeral — use external services or a long-running host.
- If your app requires persistent file storage, use cloud storage (S3/GCS) instead of filesystem.

## 9. Quick Checklist

- [ ] `vercel.json` present and correct
- [ ] `package.json` contains `build` script
- [ ] Environment variables added to Vercel
- [ ] `npm run build` succeeds locally
- [ ] Deploy via Vercel dashboard or CLI
- [ ] Test `GET /api/health` on deployed URL

---

If you want, I can:
- Add `engines.node` to `package.json` to pin Node version for Vercel.
- Commit `DEPLOY_VERCEL.md` into the repo and push.
- Run a local build to verify `dist/server.js` is produced.

Which of these should I do next?