# 22 Crack Shot

An informal club for smoothbore rimfire enthusiasts (18+), reviving backyard .22 shot-shell games: thrown round crackers, gallery rows, and the lore of Mossberg Targo, Mo-Skeet-O, the Stevens Crack Shot, and the old carnival shooting galleries. A *Gallery Games* project. The house challenge is [Pull the Sleeve](https://22crackshot.com/pull-the-sleeve): count the sleeve, shoot every cracker, and score as a percent. The Short Stack is the 13-cracker short-format round.

## What's here

| Path | What it is | License |
|---|---|---|
| `site/` | The club website (plain HTML/CSS, no build step), deployed on Vercel | MIT ([LICENSE](LICENSE)) |
| `designs/` | 3D-printable traps, cracker rails, stands, holders, score boards | CC BY-NC-SA 4.0 ([LICENSE-DESIGNS.txt](LICENSE-DESIGNS.txt)) |
| `targets/` | Printable Letter-size PDF targets and Pull the Sleeve / Short Stack score cards | CC BY-NC-SA 4.0 |

The 22 Crack Shot name, logos, and cracker mark are club branding and are **not** covered by either license; please don't use them on merchandise.

## Contributing

Want to share a trap, stand, or printable target? Read [CONTRIBUTING.md](CONTRIBUTING.md). **Targets, traps, stands, and accessories only. Never firearm parts, barrel or conversion jigs, or anything ammunition-related.**

## Editing the shared header

Edit the route list in `scripts/render-navigation.py` and run `python3 scripts/render-navigation.py` from the repository root. Each page ships its navigation in the HTML.

## Map data and credits

The Gallery Games Atlas basemap (`site/assets/atlas-states.svg`) uses the [U.S. Census Bureau's 2017 cartographic state boundaries](https://www2.census.gov/geo/tiger/GENZ2017/shp/), redistributed by [US Atlas 3.0.1](https://github.com/topojson/us-atlas/tree/v3.0.1). US Atlas is copyright 2013–2019 Michael Bostock and licensed under the ISC license; its copyright and permission notice are retained inside the SVG. The static SVG was generated with [D3 Geo](https://github.com/d3/d3-geo), [TopoJSON Client](https://github.com/topojson/topojson-client), and [TopoJSON Simplify](https://github.com/topojson/topojson-simplify). Each historical place record links to its own sources; markers show approximate localities. No map service or API key is required at runtime.

## Free membership and club noticeboard

The Join page uses a small Vercel Function for member passes and moderated notes. [Clubhouse setup, editorial review, and local tests](docs/clubhouse.md).

## Sponsorship

The shared sponsor panel supports dated campaigns and optional anonymous impression totals. No paid campaign is enabled by default. See [configuration and reporting](docs/sponsorship.md) and the [sponsor brief](docs/sponsor-brief.md). The public introduction is at `/sponsor`.

## Website monitoring

[Monitoring dashboards, costs, privacy controls and activation](docs/monitoring.md). Free Speed Insights is prepared for the next authorized release. Metered visitor analytics stays off until approved. Local previews do not send measurement data.

## Running the site locally

```sh
cd site && python3 -m http.server 8000
# open http://localhost:8000
```

The static server previews content pages. Membership requests need the Vercel Function and its database. Pages use clean URLs on Vercel (`/about` serves `about.html`); locally, open the `.html` files directly. The 18+ gate is a self-declared click-through stored in `localStorage` (key `crackshot-age-ok-v1`); clear it to see the gate again.

## Disclaimer

22 Crack Shot is an informal hobby club for adults. Nothing here is legal, safety-certification, or gunsmithing advice. Laws vary by state, county, and town; you are responsible for knowing and following them. Shooting carries risk; participants assume responsibility for their own actions and equipment. 22 Crack Shot is not affiliated with Henry Repeating Arms, Mossberg, Savage/Stevens, Remington, or any snack brand. The club never buys, sells, or trades firearms, ammunition, or parts.
