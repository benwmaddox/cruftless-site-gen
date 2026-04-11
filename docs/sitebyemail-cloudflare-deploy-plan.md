# sitebyemail.com Multi-Site Publish Plan

## Goal

Script deployment and backup for many generated brochure sites so each site can be published without manual upload work.

Target behavior:

- Each site publishes from `(slug)/dist`.
- Each site is reachable at `(slug).sitebyemail.com`.
- Each site folder is zipped and uploaded to a backup bucket on every deploy.
- The process is repeatable from a script, not handled by one-off manual steps.

## Recommendation

Use Cloudflare instead of AWS for the first version.

Reasoning:

- wildcard DNS for `*.sitebyemail.com` is straightforward
- a single Worker can route every subdomain to a slug-specific prefix
- R2 handles both live assets and backups
- certificate and edge routing are simpler than an S3 + CloudFront setup

AWS is still viable, but it adds more moving parts:

- S3 for live files
- S3 for backups
- CloudFront
- ACM wildcard certificate
- Lambda@Edge or CloudFront Function for host-to-prefix rewriting

## Proposed Architecture

### Cloudflare resources

- Cloudflare zone for `sitebyemail.com`
- wildcard DNS record for `*.sitebyemail.com`
- one Worker bound to route `*.sitebyemail.com/*`
- one private R2 bucket for live published files
- one private R2 bucket for backups
- one API token for scripted upload/deploy work

### Logical flow

1. A local publish script scans the configured site folders.
2. For each site, it validates the slug and confirms that `dist/` exists.
3. It uploads the `dist/` contents into the live R2 bucket under `live/<slug>/`.
4. It zips the full site folder and uploads the archive into the backup R2 bucket under `backups/<slug>/<timestamp>.zip`.
5. A Worker receives requests for `<slug>.sitebyemail.com` and serves files from `live/<slug>/...`.

## Bucket Layout

### Live bucket

```text
live/
  alpha-site/
    index.html
    about/index.html
    assets/main.css
  bravo-site/
    index.html
    contact/index.html
```

### Backup bucket

```text
backups/
  alpha-site/
    2026-04-10T13-30-00.zip
    2026-04-11T09-00-00.zip
  bravo-site/
    2026-04-10T13-30-00.zip
```

## Routing Rules

The Worker should derive the slug from the request hostname.

Examples:

- `alpha-site.sitebyemail.com/` -> `live/alpha-site/index.html`
- `alpha-site.sitebyemail.com/about/` -> `live/alpha-site/about/index.html`
- `alpha-site.sitebyemail.com/assets/main.css` -> `live/alpha-site/assets/main.css`

Suggested resolution order:

1. exact object path
2. path with `/index.html`
3. path with `.html`
4. site-level `404.html` if present
5. generic `404` response

## Site Discovery

Do not rely only on folder names. Use a mapping file so slug safety and source paths are explicit.

Suggested file:

`deploy/sites.json`

Example:

```json
[
  {
    "slug": "smartwayappliancerepair",
    "sitePath": "F:/Refreshes/smartwayappliancerepair-com",
    "publishDir": "dist",
    "enabled": true
  },
  {
    "slug": "bairdautomotive",
    "sitePath": "F:/Refreshes/bairdautomotive-com",
    "publishDir": "dist",
    "enabled": true
  }
]
```

Why this matters:

- folder names may not always be safe subdomains
- some sites may need to be skipped temporarily
- future metadata can be added without changing the script contract

## Script Plan

### `scripts/publish-sites.mjs`

Responsibilities:

- read `deploy/sites.json`
- validate each slug against DNS-safe rules
- confirm `<sitePath>/<publishDir>` exists
- upload the full contents of `dist/` to `live/<slug>/`
- set content types
- set cache behavior
- optionally write a deploy manifest

Suggested behavior:

- `html` files: low cache TTL or no-cache
- hashed assets: long cache TTL
- skip disabled entries
- fail the run if a configured live site has no `dist/`

### `scripts/backup-sites.mjs`

Responsibilities:

- read `deploy/sites.json`
- create a timestamped zip of each full site folder
- upload the archive to `backups/<slug>/<timestamp>.zip`
- optionally prune old backups based on retention rules

### `scripts/deploy-all.mjs`

Responsibilities:

- run publish first
- run backup second
- print a compact deployment summary

This can remain one command for normal use:

```text
npm run deploy:sites
```

## Worker Plan

Suggested location:

`deploy/worker/`

Suggested files:

- `deploy/worker/src/index.ts`
- `deploy/worker/wrangler.jsonc`

Worker responsibilities:

- parse slug from host
- reject unknown or invalid hostnames
- map request path to `live/<slug>/...`
- fetch from the live R2 bucket
- send correct `content-type`
- optionally add a small cache layer with Cloudflare cache

Minimal pseudocode:

```ts
const slug = getSlugFromHostname(request);
const keyCandidates = buildKeyCandidates(slug, pathname);

for (const key of keyCandidates) {
  const object = await env.LIVE_BUCKET.get(key);
  if (object) return objectToResponse(object);
}

return new Response("Not found", { status: 404 });
```

## Environment And Secrets

Expected secrets or env values:

- Cloudflare account ID
- Cloudflare zone ID
- R2 bucket names
- API token with Worker and R2 permissions

Local `.env` values for scripts may include:

```text
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CF_ZONE_NAME=sitebyemail.com
CF_LIVE_BUCKET=sitebyemail-live
CF_BACKUP_BUCKET=sitebyemail-backups
```

## Packaging Details

Zip the whole site folder, not only `dist/`.

That preserves:

- source content
- generated output
- images and other raw assets
- config used to reproduce the site later

Recommended exclusions:

- `node_modules`
- local caches
- temporary reports if they can be regenerated

## Validation Rules

The deploy scripts should fail early on:

- missing `slug`
- slug that is not DNS-safe
- duplicate slugs
- missing `dist/`
- empty `dist/`
- upload failure
- backup archive failure

## Rollout Steps

1. Create `deploy/sites.json`.
2. Add Worker code and Wrangler config.
3. Add publish and backup scripts.
4. Add `package.json` commands for deploy and backup.
5. Provision the two R2 buckets.
6. Configure the wildcard DNS record.
7. Deploy the Worker.
8. Run a dry run against one known site.
9. Publish one site end to end.
10. Expand to all configured sites.

## Operating Model

Best first version:

- run locally on the Windows machine that has access to `F:/Refreshes/...`
- trigger via PowerShell or Task Scheduler

Optional later version:

- move source folders to a stable server path
- run on a self-hosted GitHub Actions runner
- add deploy history reporting

## Suggested `package.json` Commands

```json
{
  "scripts": {
    "deploy:sites": "node scripts/deploy-all.mjs",
    "deploy:publish": "node scripts/publish-sites.mjs",
    "deploy:backup": "node scripts/backup-sites.mjs",
    "deploy:worker": "wrangler deploy --config deploy/worker/wrangler.jsonc"
  }
}
```

## Local Test Path

What can be tested inside this repo before touching Cloudflare:

- `npm run test:deploy`
- `npm run deploy:publish -- --config tests/fixtures/deploy-smoke/sites.json --dry-run`
- `npm run deploy:backup -- --config tests/fixtures/deploy-smoke/sites.json --dry-run`
- `npm run deploy:sites -- --config tests/fixtures/deploy-smoke/sites.json --dry-run`

What those cover:

- deploy config validation
- slug and bucket-key generation
- Worker path resolution
- dry-run site discovery, publish planning, and backup planning

## Manual Cloudflare Steps

These still require a real Cloudflare account and real site folders:

1. Copy `deploy/sites.example.json` to `deploy/sites.json` and replace the sample paths and slugs.
2. Copy `deploy/.env.example` to `deploy/.env` and fill in the R2 credentials and bucket names.
3. Create the `sitebyemail-live` and `sitebyemail-backups` R2 buckets, or edit the names to match your own.
4. Create an R2 access key pair with permission to read and write those buckets.
5. Authenticate Wrangler with Cloudflare.
6. Confirm the `sitebyemail.com` zone is on Cloudflare.
7. Create the wildcard DNS record for `*.sitebyemail.com`.
8. Review `deploy/worker/wrangler.jsonc` and change the bucket name, zone, or domain suffix if needed.
9. Run `npm run deploy:publish -- --config deploy/sites.json`.
10. Run `npm run deploy:backup -- --config deploy/sites.json`.
11. Run `npm run deploy:worker`.
12. Visit a live site such as `https://<slug>.sitebyemail.com/`.

## Risks And Decisions

### Decisions still needed

- final source root or roots to scan
- whether every site must publish on every run or only changed sites
- backup retention window
- whether unpublished sites should be removed from the live bucket automatically
- whether there should be a per-site custom domain option later

### Notable risks

- local `F:/` paths mean cloud-hosted CI runners cannot access the source folders
- subdomain-safe slugs need strict validation
- cache settings must avoid stale HTML while still caching assets efficiently
- backup zip size may become large if source folders accumulate generated artifacts

## Future Enhancements

- deploy only changed sites by comparing hashes or timestamps
- keep versioned live releases and support rollback
- publish a `deploy-manifest.json` per site
- send deploy failure notifications
- add optional custom domains per site

## If AWS Is Needed Later

Equivalent AWS shape:

- S3 bucket for live files
- S3 bucket for backups
- CloudFront in front of the live bucket
- wildcard certificate for `*.sitebyemail.com`
- CloudFront Function or Lambda@Edge to map hostnames to prefixes

This should be treated as the fallback option, not the first implementation.
