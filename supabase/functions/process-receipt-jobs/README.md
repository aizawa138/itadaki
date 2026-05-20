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

## Run periodically (recommended)

Create a schedule (Dashboard -> Edge Functions -> process-receipt-jobs -> Schedules)

- Every 1 minute

This function processes 1 queued job per invocation.
If you need higher throughput, change it to process multiple jobs.
