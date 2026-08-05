# Activation runbook

Everything in the analytics + unlisting build is deployed and tested, but a few
steps need your Cloudflare account and Google account. They are collected here.
Run them from the `portfolio/` directory.

Until step 1 is done, `/track` fails safe (returns 204, stores nothing) and
`/stats` shows "not activated". Until step 3, `/stats` returns 403 to everyone.

---

## 1. Create the D1 database and bind it (starts data collection)

```bash
# One-time browser login to your Cloudflare account.
npx wrangler login

# Create the database. Copy the database_id it prints.
npx wrangler d1 create analytics
```

Then open `wrangler.jsonc` and uncomment/add the binding with your id:

```jsonc
"d1_databases": [
  { "binding": "DB", "database_name": "analytics", "database_id": "PASTE_ID_HERE" }
]
```

(Add it as a real JSON key, after the `assets` block. The template is already
in `wrangler.jsonc` as a comment.)

## 2. Create the tables (apply migrations)

```bash
# Applies migrations/*.sql to the REMOTE (production) database.
npx wrangler d1 migrations apply analytics --remote
```

Then redeploy so the Worker picks up the new binding:

```bash
git add wrangler.jsonc && git commit -m "chore: bind analytics D1" && git push
```

Wait ~30-45s, then a real visit will write rows. Verify:

```bash
npx wrangler d1 execute analytics --remote --command "SELECT COUNT(*) FROM events"
```

## 3. Put /stats behind Cloudflare Access (makes the dashboard private)

The dashboard refuses to render (403) unless a Cloudflare Access identity header
is present, so it stays private until this is set up.

1. Cloudflare Dashboard, then **Zero Trust** (one-time free plan setup if asked).
2. **Access, then Applications, then Add an application, then Self-hosted**.
3. Application domain: `marklu.page`, path: `/stats`.
4. Add a policy: Action **Allow**, include **Emails**, value your email
   (`marklu0509@gmail.com`).
5. Save. Now visiting `marklu.page/stats` prompts a login, and only you get in.

## 4. Exclude your own visits

On each of your own devices/browsers, open once:

```
https://marklu.page/?me=1
```

That sets a local opt-out flag, so your visits are never counted. Repeat per
browser; clearing browser data undoes it.

## 5. Remove already-indexed pages from Google (finish the unlisting)

The site now says `noindex`, but pages Google already indexed can linger for
weeks. To speed removal:

1. Go to **Google Search Console**, add and verify the `marklu.page` property.
2. Use **Removals, then New request** to temporarily hide URLs, and/or submit the
   site so Google recrawls and honours the `noindex`.
3. Because `robots.txt` allows crawling, Google can see the `noindex` and will
   drop the pages over the following crawls.

---

## Handy commands

```bash
npm test                      # run the full suite
npx wrangler deploy --dry-run # validate config/bundle before pushing
npx wrangler d1 execute analytics --remote --command "SELECT page, COUNT(*) FROM events WHERE section IS NULL GROUP BY page"
```
