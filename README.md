# kyleboas.com

## Newsletter Worker deployment

The newsletter API is a Cloudflare Worker named `kyleboas-newsletter-api` that serves only `kyleboas.com/api/newsletter/*`. It uses the D1 database `kyleboas-newsletter` with binding `NEWSLETTER_DB` and database ID `882fcb57-8baa-4267-a9f4-36b309ba3f42`.

The migration in `migrations/0001_newsletter_subscriptions.sql` has already been applied remotely. Do not put secrets in this repository, `.env`, `wrangler.jsonc`, or chat.

`RESEND_API_KEY` must exist as a Cloudflare Worker secret on `kyleboas-newsletter-api`, where it is already configured. The Worker reads it at runtime and the secret persists across deploys.

Worker environment bindings in `wrangler.jsonc`:

- `NEWSLETTER_FROM`: confirmation email sender.
- `NEWSLETTER_PUBLIC_BASE_URL`: public origin used in confirmation links and `/api/newsletter/latest` feed reads.
- `CORS_ORIGIN`: allowed browser origin.
- Optional `NEWSLETTER_REPLY_TO`: add in Cloudflare Worker variables only if a separate reply-to address is needed.

Deploy paths:

- Preferred: use the Cloudflare connected repository/deployment integration for this Worker, with `wrangler.jsonc` as the Worker config.
- Local fallback after broker authorization is fixed: `npm run deploy:newsletter`. Only run `npm run secret:newsletter:resend` if the Worker secret ever has to be re-set.

Validation after deploy:

```bash
curl -fsS https://kyleboas.com/api/newsletter/latest
```

Error responses include a stable machine-readable `code` field; `error` is retained as a compatibility alias. `/api/newsletter/latest` reads the latest item from the public Jekyll feed and does not subscribe or deliver email.
