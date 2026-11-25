# Club sponsorship

One shared component supplies the homepage sidebar and end-of-page placements on both Halls and the arcade lobby. The games themselves have no placement. A static club-support card is useful before sponsors are booked, without JavaScript, or if the API is unavailable. No sponsor is invented or enabled by default.

## Configure a booking

Edit `site/lib/sponsor-config.mjs`. Set `contactEmail` to the public enquiry address; an empty string keeps the enquiry button hidden on `/sponsor`. This is public configuration, never a place for private contracts or credentials.

Add a reviewed entry to `campaigns`:

```js
{
  id: 'community-partner-winter-2026', // Unique per booking; retain for reports.
  enabled: true,
  name: 'Partner name',
  headline: 'Supporting a shared collection',
  description: 'A short, approved message from the sponsor.',
  url: 'https://example.org/about',
  linkLabel: 'Meet our supporter',
  placements: ['home', 'smoothbore-hall', 'gallery-hall', 'arcade-lobby'],
  startsAt: '2026-12-01T00:00:00-05:00',
  endsAt: '2027-01-01T00:00:00-05:00',
  priority: 10
  // Optional image: '/assets/sponsors/community-partner.webp',
  // imageAlt: 'Description of the approved sponsor artwork'
}
```

Replace all example content before enabling. Use an HTTPS destination and plain text. Optional static artwork must be local under `site/assets/sponsors/`, ideally a 300 × 250 image (600 × 500 for high-density displays) compressed below 60 KB. The image is contained, not cropped. Avoid animation and embedded tracking. Obtain the sponsor's approved artwork and permission to use its marks.

Start is inclusive; end is exclusive. Dates must include `Z` or an explicit offset. An invalid/disabled campaign is never served. When bookings overlap, highest priority wins, then alphabetically first ID. The API supplies the next start/end boundary and an open page refreshes then. No cron task is needed. If the refresh fails, the previous ad is removed and the club-support card returns.

Each paid panel is labeled **Advertisement** and uses `rel="sponsored noopener"`. Advertising does not change exhibit research. Keep campaign IDs unique; validation rejects duplicates in the checked-in configuration.

## Optional impression counts

Display and scheduling work without a database. To enable reporting in an approved environment:

1. Apply `db/002-sponsors.sql` once as the database owner, after the existing membership schema and `club_web` role exist. It creates only sponsor tables and grants; it does not alter membership tables.
2. Keep the existing `CLUB_DATABASE_URL` for that environment. Set `SPONSOR_METRICS_ENABLED=true` only after the migration succeeds.
3. Deploy through the existing release process. Verify one real campaign impression before promising reports to a sponsor. Leave the flag unset to disable counting at any time.

No hosted migration, environment change, or deployment is performed merely by merging this code. The migration is supplied in the repository; it is not an automatic deploy hook.

The browser records at most one impression per campaign and placement per page load, after 50% visibility for one uninterrupted second. Hidden tabs and the age overlay do not count. An API-issued signed token expires after ten minutes. A repeated token cannot increment the total twice. The API checks the booking again when recording and caps requests at 120 per hourly network bucket. Unsupported viewability APIs, blocked JavaScript, failed requests, and rate limiting can undercount. Reloads and multiple tabs can count again. This is basic first-party reporting, not audited advertising measurement, unique visitors, click tracking, or billing-grade fraud protection.

Only daily campaign/placement totals persist. Random deduplication IDs expire after one day; keyed network quota digests expire after two hours. Expired rows are removed on the next impression request. Raw IP addresses, member IDs, user agents, referrers, and browsing histories are not written by this counter. Hosting-provider access logs are separate from these tables. No ad-network scripts, third-party tracking, or advertising cookies are added.

Use the database owner's SQL console for a report; there is deliberately no public reporting endpoint:

```sql
SELECT day, campaign_id, placement, impressions
FROM sponsor_daily
WHERE day >= DATE '2026-12-01' AND day < DATE '2027-01-01'
ORDER BY day, campaign_id, placement;

SELECT campaign_id, placement, sum(impressions) AS impressions
FROM sponsor_daily
WHERE day >= DATE '2026-12-01' AND day < DATE '2027-01-01'
GROUP BY campaign_id, placement ORDER BY campaign_id, placement;
```

Days use UTC; booking dates can use explicit New York offsets. State the report's timezone. Do not call impressions members, visitors, or clicks.

## Verification and release

```sh
npm ci --prefix site
npm ci --prefix tests/club
npm test --prefix tests/club
git diff --check origin/main...HEAD
```

Tests use isolated in-memory Postgres with the real handler, driver, schema and restricted role. They cover booking boundaries, invalid configuration, duplicate tokens, origin checks, rate limits and database failure, plus the existing membership flows. Check the homepage at desktop and phone widths, the sponsorship link and enquiry state, paid and empty panels, end-of-booking removal, and all four placements before release.

Use [the sponsor brief](sponsor-brief.md) to prepare outreach. Populate real audience data before sending it. Pricing and sponsor commitments are editorial/business decisions; no rate or reach is promised by this feature.
