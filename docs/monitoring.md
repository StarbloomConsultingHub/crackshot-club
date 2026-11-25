# Website monitoring

Status on November 25, 2026: prepared on a branch based on sponsorship PR #8, not deployed. The Vercel team is **Starbloom / Pro**. Web Analytics is currently disabled in the project dashboard. Speed Insights is on the free tier and is awaiting its first events. No paid add-on, deployment, or database change was made for this setup.

## Dashboards

| What to check | Dashboard | Cost / scope |
| --- | --- | --- |
| Visitors, page views, popular halls and games, referrers, devices and countries | [Web Analytics](https://vercel.com/starbloomconsulting/crackshot-club/analytics) | Optional; metered on Pro. Off pending owner approval. |
| Real Experience Score, mobile versus desktop, pages needing attention | [Speed Insights](https://vercel.com/starbloomconsulting/crackshot-club/speed-insights) | Free tier; code ready. Does not include Plus-only detailed metrics. |
| Requests, function behavior and errors | [Observability](https://vercel.com/starbloomconsulting/crackshot-club/observability) and [Logs](https://vercel.com/starbloomconsulting/crackshot-club/logs) | Basic Observability is available at no added cost, with limited retention. Requests include bots and assets; they are not visitor counts. |
| Hosting and analytics consumption | [Usage](https://vercel.com/starbloomconsulting/crackshot-club/usage) | Check the team total as well: Pro usage credit is shared by its projects. |

## Costs verified against current Vercel documentation

- **Web Analytics:** $0.03 per 1,000 collected events ($0.30 per 10,000; $3 per 100,000), subject to the team's Pro usage credit. Pro has no separate free event allowance. Page views and custom events both count. This implementation only enables page views when approved; it adds no custom events.
- **Speed Insights free tier:** no project fee or event overage charges. The team shares 10,000 events over a rolling 30 days. Collection pauses at the limit; the website keeps working. The free dashboard offers Real Experience Score and limited path/route breakdowns over 24 hours or 7 days.
- **Speed Insights Plus:** $10/project/month plus $0.65 per 10,000 events on Pro. Not enabled or needed for this setup.
- **Web Analytics Plus:** $10/team/month. Not enabled or needed for basic visitor reporting.
- Analytics scripts still incur ordinary hosting requests/data transfer. The free performance tier is not a guarantee that all hosting costs are zero.

Sources, checked November 25, 2026:
[Web Analytics pricing](https://vercel.com/docs/analytics/limits-and-pricing),
[Speed Insights pricing](https://vercel.com/docs/speed-insights/limits-and-pricing),
[Pro plan](https://vercel.com/docs/plans/pro-plan),
[Observability](https://vercel.com/docs/observability).
Older cached search results describe Speed Insights as paid-only on Pro; the current documentation and this project's dashboard show the newer free tier.

## Implementation and privacy

All HTML pages include the small, deferred `site/assets/monitoring.js` loader. It follows Vercel's plain-HTML queue and script integration; no frontend framework, bundler, database, or additional npm dependency is required. The standard same-origin `/_vercel/speed-insights/script.js` and `/_vercel/insights/script.js` paths remain the defaults in Vercel's published SDKs (speed-insights 2.1.0; analytics 2.0.1).

The loader runs only on HTTPS `22crackshot.com` and `www.22crackshot.com`, and only for an explicit list of public paths. Local development, `.vercel.app` previews, the membership page, API paths, error/unknown paths and other hosts do not load either collector. Query strings and fragments are removed from measured page URLs. `.html`, trailing-slash and index aliases are normalized. Both hosts are reported under the canonical hostname.

No member passes, nicknames, notes, form values, game scores or custom event properties are collected by this integration. There is no session replay or advertising pixel. Vercel's services still process connection metadata for their measurement; hosting logs are separate from client-side analytics. See Vercel's [Web Analytics privacy documentation](https://vercel.com/docs/analytics/privacy-policy) and [Speed Insights privacy documentation](https://vercel.com/docs/speed-insights/privacy-policy).

The loader respects Global Privacy Control and Do Not Track. Visitors can pause measurement at [History → Website measurement](https://22crackshot.com/about#website-measurement). The choice is stored locally as `crackshot-metrics-disabled=yes` and does not change membership/session or age-gate storage. It applies to that browser and origin. If local storage is unavailable, measurement stays off. The owner can use the same control to exclude their own visits.

Vercel page-view totals are estimates affected by browser privacy settings, blockers and JavaScript availability. They are not audited ad impressions or exact people. A game page view indicates a visit to the game, not a completed game. Membership is excluded from these client reports; confirmed membership totals should come from the club database. Sponsorship impression reporting, if separately enabled, is a distinct system.

## Activation and release

1. Keep this work on its branch until the applicable repository checks pass. Respect the existing deployment policy: do not assume a Git push is harmless, do not unpause or deploy as part of analytics setup.
2. Free Speed Insights is ready in the code. Keep the project on its free tier; do not select Upgrade/Plus. It starts collecting only after an authorized production release.
3. For visitor reports, first obtain the owner's approval for metered Web Analytics. Then enable **Analytics → Enable** for `crackshot-club` (not a Plus upgrade), set `WEB_ANALYTICS_ENABLED = true` in the loader, rerun the checks, and include the change in the authorized release. Update this status note when activated.
4. After the authorized deployment, visit a public page on the custom domain with measurement allowed. Check the browser Network panel for successful same-origin script and measurement requests. Confirm the dashboard leaves its setup state and shows real data. Do not treat dashboard demo data as traffic. No real collection is claimed before this check.
5. Visit `/join`, a preview URL, and a public page with measurement paused: neither collector should load. Test a query/hash URL and confirm the measured URL excludes both. Restore your own browser opt-out afterwards.

If Web Analytics is later enabled, update the short website measurement notice in `site/about.html` to mention visitor counts as well as performance. Recheck prices before enabling any paid feature. Existing Vercel billing/spend controls were not changed; a team-wide automatic pause could affect unrelated websites and should not be added casually.

## Maintenance

Run `npm ci --prefix site`, `npm ci --prefix tests/club`, and `npm test --prefix tests/club`. The tests check collection exclusions, URL redaction, privacy preferences, the optional page-view mode, single script injection and loader coverage across HTML files, alongside the existing membership integration tests.

When adding a public page, add the shared deferred script tag and review the public-path allowlist. Coverage tests catch missing tags. A new path is unmeasured until explicitly allowed. Keep new custom events out until their purpose, data fields and event-volume impact have been reviewed.

For a first monthly audience summary, record the date range, visitors, page views, top pages, top referrers, mobile share and performance trend. Use that dated summary in the sponsor brief; do not invent audience figures. These dashboards are available on demand. This change does not create recurring reports, downtime polling, or alert subscriptions.
