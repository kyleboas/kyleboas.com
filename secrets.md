# Newsletter secrets

Do not put newsletter secrets in this repo, `.env`, shell history, Wrangler config, GitHub secrets, or chat.

## Cloudflare Worker copy

`RESEND_API_KEY` is already saved as a Cloudflare Worker secret on `kyleboas-newsletter-api`. That is the copy the Worker reads at runtime, and it persists across deploys.

## Local broker copy

Kyle also stores the Resend API key in the root-owned local secret broker under the project scope `kyleboas.com/resend`. Agents must not read `/etc/agent-secrets/*`; only approved broker commands may pass that value to Cloudflare.

Local broker deployment remains blocked until the Cloudflare credential behind the broker has Worker deploy and route permissions. This path is only needed if the Worker secret ever has to be re-set or a local fallback deploy is needed.

Required local broker token capabilities:

- Account: Workers Scripts Edit
- Zone `kyleboas.com`: Workers Routes Edit
- Zone `kyleboas.com`: Zone Read

D1 is already configured in `wrangler.jsonc` as binding `NEWSLETTER_DB` for database `kyleboas-newsletter`.
