# Deployment

This document describes the production deployment setup for the clinic
management system.

## Production Services

- Frontend: `https://medlinks.uk`
- Backend API: `https://api.medlinks.uk`
- API documentation: `https://api.medlinks.uk/docs`

## Backend on Railway

1. Connect the GitHub repository to Railway.
2. Create or attach PostgreSQL and Redis services.
3. Deploy the backend using the root `Dockerfile`.
4. Configure the custom domain `api.medlinks.uk`.
5. Add the required environment variables.
6. Run `python seed.py` once only if seed data is needed.

Required backend variables:

```env
SECRET_KEY=<secure-random-value>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
DATABASE_URL=postgresql+asyncpg://postgres:<password>@postgres.railway.internal:5432/railway
REDIS_URL=redis://redis.railway.internal:6379
FRONTEND_URL=https://medlinks.uk
EMAILS_ENABLED=True
RESEND_API_KEY=<resend-api-key>
EMAILS_FROM=noreply@medlinks.uk
ALLOW_SEED=false
```

Set `ALLOW_SEED=true` only during initial seeding, then change it back to
`false`.

## Frontend on Vercel

1. Connect the GitHub repository to Vercel.
2. Set the project root to `frontend`.
3. Set the build command to `npm run build`.
4. Set the output directory to `dist`.
5. Add the production API URL.

Required frontend variable:

```env
VITE_API_URL=https://api.medlinks.uk
```

## DNS on Cloudflare

Recommended records:

| Type  | Name | Target                    | Proxy    |
| ----- | ---- | ------------------------- | -------- |
| A     | @    | Vercel IP                 | DNS only |
| CNAME | api  | Railway backend hostname  | DNS only |

Railway custom domain verification usually requires DNS-only mode for the API
record.

## Local Production Check

Before deploying, run:

```bash
docker compose up --build
```

Then check:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:8000/health`
- API docs: `http://localhost:8000/docs`
