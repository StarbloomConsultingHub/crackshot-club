# Crack Shot .22 LR Club

An informal club for adults (18+) reviving backyard smoothbore .22 shot-shell games: thrown round crackers, gallery rows, and the lore of Mossberg Targo, Mo-Skeet-O, the Stevens Crack Shot, and the old carnival shooting galleries. A *Gallery Games* project.

## What's here

| Path | What it is | License |
|---|---|---|
| `site/` | The club website (plain HTML/CSS, no build step), deployed on Vercel | MIT ([LICENSE](LICENSE)) |
| `designs/` | 3D-printable traps, cracker rails, stands, holders, score boards | CC BY-NC-SA 4.0 ([LICENSE-DESIGNS.txt](LICENSE-DESIGNS.txt)) |
| `targets/` | Printable Letter-size PDF targets and score cards | CC BY-NC-SA 4.0 |

The Crack Shot name, logos, and cracker mark are club branding and are **not** covered by either license; please don't use them on merchandise.

## Contributing

Want to share a trap, stand, or printable target? Read [CONTRIBUTING.md](CONTRIBUTING.md). **Targets, traps, stands, and accessories only. Never firearm parts, barrel or conversion jigs, or anything ammunition-related.**

## Running the site locally

```sh
cd site && python3 -m http.server 8000
# open http://localhost:8000
```

Pages use clean URLs on Vercel (`/about` serves `about.html`); locally, open the `.html` files directly. The 18+ gate is a self-declared click-through stored in `localStorage` (key `crackshot-age-ok-v1`); clear it to see the gate again.

## Disclaimer

Crack Shot is an informal hobby club for adults. Nothing here is legal, safety-certification, or gunsmithing advice. Laws vary by state, county, and town; you are responsible for knowing and following them. Shooting carries risk; participants assume responsibility for their own actions and equipment. Crack Shot is not affiliated with Henry Repeating Arms, Mossberg, Savage/Stevens, Remington, or any snack brand. The club never buys, sells, or trades firearms, ammunition, or parts.
