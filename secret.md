# Cloudflare Worker secret

The newsletter API needs a Resend API key at runtime. It is already saved as the Cloudflare Worker secret `RESEND_API_KEY` on `kyleboas-newsletter-api`, so the live Worker reads it directly and it survives redeploys.

Never commit the key to this repo, put it in `.env`, add it to `wrangler.jsonc`, copy it into GitHub, or paste it in chat.

Optional local fallback, only if the Worker secret ever needs to be re-set after broker authorization is fixed:

```bash
npm run secret:newsletter:resend
npm run deploy:newsletter
```

The D1 database ID in `wrangler.jsonc` is already real, and `migrations/0001_newsletter_subscriptions.sql` has already been applied remotely.
