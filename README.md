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

## Infinite Flight Inbounds API

The same Worker serves the shared public Inbounds snapshot at `kyleboas.com/api/infiniteflight/*`. It is a constrained proxy, not a general upstream pass-through: the public route exposes only `/session` and `/flights`, so every visitor receives the same configured Live-session and flight snapshot. The browser never receives `INFINITEFLIGHT_API_KEY`.

A single globally named Durable Object owns all upstream requests for the shared API key. It caches the upstream session list for 600 seconds and the active-session flight list for 15 seconds, then coalesces concurrent misses for either path into one upstream request. Cache misses consume a persistent global token bucket with a capacity of 30 and a refill rate of 30 requests per minute (0.5 request per second); after the bucket is empty, the coordinator returns `429` with the time until one token is available. This bound applies across Worker isolates and edge locations, not per visitor or per edge cache. `INFINITEFLIGHT_UPSTREAM_REQUESTS_PER_MINUTE` is the server-side limit setting.

- Session discovery is cached for 600 seconds (`INFINITEFLIGHT_SESSION_NAME` defaults to `Expert Server`).
- Flight data is cached for 15 seconds; the UI requests it at the same minimum interval.
- The browser stops its automatic flight, ATC, and interpolation update timers after 15 minutes without user activity. A new interaction and update action starts them again.

Before an authorized deployment, set the Worker secret through the local broker without displaying it:

```bash
sudo secret global infiniteflight | npm run secret:infiniteflight
```

Then deploy the existing Worker configuration through the authorized deployment path (or, only when separately authorized, `npm run deploy:newsletter`). Confirm the route after deployment:

```bash
curl -fsS https://kyleboas.com/api/infiniteflight/session
curl -fsS https://kyleboas.com/api/infiniteflight/flights
```

Do not place the key in this repository, a Wrangler variable, a browser bundle, or a `.env` file. `upstream_rate_limited` (HTTP 429) tells the UI to pause; authentication and other upstream failures return stable error codes without passing through upstream response bodies.
