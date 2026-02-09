# Deploying Mini E-Commerce API to Netlify

This document explains how to deploy the `Mini E-Commerce API` to Netlify using Netlify Functions. Netlify runs serverless functions, so we adapt the Express app with `serverless-http`.

> Note: Netlify Functions are short-lived serverless functions. If you need long-running processes or background workers, use another host (e.g., Vercel, a VPS, or container). This guide shows one workable approach for server-hosted APIs.

---

## 1. Overview

- Build step produces `dist/` (compiled JS files) via `npm run build`.
- We add a Netlify Function wrapper at `netlify/functions/server.js` which uses `serverless-http` to wrap the Express `app` exported from `dist/app.js`.
- `netlify.toml` routes all HTTP requests to the `server` function.

## 2. What I added

- `netlify.toml` — Netlify config (build command, functions directory)
- `netlify/functions/server.js` — small wrapper using `serverless-http`

## 3. Required package

Install `serverless-http`:

```bash
npm install serverless-http
```

(If you prefer, add to `package.json` and run `npm install`.)

## 4. Environment variables

Set the same environment variables you use locally in the Netlify project settings (Site > Settings > Environment > Environment variables):

- `DATABASE_URL` (Postgres connection string)
- `JWT_ACCESS_SECRET` (production secret)
- `JWT_REFRESH_SECRET` (production refresh secret)
- `NODE_ENV=production`
- `ENABLE_SWAGGER=false` (recommended)
- `BCRYPT_SALT_ROUNDS` (e.g., `12`)
- `CORS_ORIGIN` (your frontend origin)

## 5. `netlify.toml` example

```toml
[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/.netlify/functions/server"
  status = 200
  force = true
```

This routes all requests to the `server` function.

## 6. Netlify Function wrapper

Create `netlify/functions/server.js` with the following (example already included in repo):

```js
// netlify/functions/server.js
const serverless = require('serverless-http');
const { app } = require('../../dist/app');

module.exports.handler = serverless(app);
```

Notes:
- This assumes `npm run build` compiles `src/app.ts` to `dist/app.js` and that `dist/app.js` exports the Express `app` (the project already exports `app` from `src/app.ts`).
- You may need to adapt the relative paths if your build outputs to a different structure.

## 7. Build & Deploy (Netlify UI)

1. Push your repo to GitHub/GitLab/Bitbucket.
2. Create a new Netlify site and connect the repo.
3. Set the environment variables on Netlify.
4. Netlify will run `npm run build` during the deploy.

## 8. Deploy with Netlify CLI

```bash
npm i -g netlify-cli
netlify login

# Build locally
npm run build

# Deploy (interactive)
netlify deploy --prod
```

If using the interactive deploy, specify the `dist` folder as the deploy folder and ensure `netlify/functions` exists in your repo.

## 9. Common Gotchas

- Netlify functions have a max execution time — long-running operations may fail.
- DB connections: reuse Prisma client across invocations to minimize cold-start overhead. Consider using a connection pool or serverless-friendly database provider.
- If you use absolute imports or path aliases, ensure the compiled `dist` code resolves correctly.

## 10. Quick Checklist

- [ ] Install `serverless-http`
- [ ] Add `netlify.toml` (example above)
- [ ] Add `netlify/functions/server.js` wrapper
- [ ] Add environment variables in Netlify UI
- [ ] Push to repo and connect to Netlify

---

If you want, I can also:
- Add `serverless-http` to `package.json` and run `npm install` (please confirm if you want me to modify package.json here).
- Create the `netlify/functions/server.js` wrapper file for you (already added here).
- Commit and push these changes to your repo.

Tell me which next step you'd like.