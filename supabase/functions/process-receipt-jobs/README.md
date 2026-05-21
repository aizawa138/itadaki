# process-receipt-jobs (Supabase Edge Function)

Processes queued receipt scan jobs.

## Deploy

1. Ensure your project is linked (already linked in this repo).

2. Set secrets:

- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

Example:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=... GEMINI_API_KEY=...
```

3. Deploy:

```bash
supabase functions deploy process-receipt-jobs
```

If you change the function code, deploy again.

## Run periodically (recommended)

Create a schedule (Dashboard -> Edge Functions -> process-receipt-jobs -> Schedules)

- Every 1 minute

This function processes 1 queued job per invocation.
If you need higher throughput, change it to process multiple jobs.

## Troubleshooting

- If invocation returns 404, the function is not deployed (or the name is wrong).
- If invocation returns 500, open Edge Function logs.
  - This function returns a JSON error with a `stage` field (e.g. `env`, `download`, `gemini`, `db`).
