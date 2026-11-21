# Research

Sourced research notes behind the club's site content: hall exhibits, challenge rules, costs, and history. Notes here are working references for whoever edits `site/`. **This folder is not deployed.** Only `site/` is uploaded to Vercel, so nothing here goes live on 22crackshot.com.

## Index

| Note | Topic | Status | Researched | Backs |
|---|---|---|---|---|
| [smoothbore-22/catalog-audit-2026-11.md](smoothbore-22/catalog-audit-2026-11.md) | Is the Smoothbore Hall complete? Covered vs. missing factory .22 smoothbores, likely or rumored models, suggested fixes and collector tiers | Open | 2026-11-20 | `site/hall.html`, `site/assets/halls/smoothbore.json` |
| [pull-the-sleeve/cracker-and-ammo-counts.md](pull-the-sleeve/cracker-and-ammo-counts.md) | Real sleeve and pack counts (about 30 per sleeve, 13 per Fresh Stacks-style pack, 32 foodservice) and shot-shell cost per round | Settled | 2026-11-20 | `site/pull-the-sleeve.html`, `targets/`, arcade game |

Add a row when you add a note. Keep the newest audit for a topic alongside the older ones, and date the file name (`topic/what-YYYY-MM.md`) when a note is a point-in-time snapshot.

## Starting a note

Copy [_templates/research-note.md](_templates/research-note.md) into a topic folder (for example `research/gallery-history/`) and fill it in.

## House rules

**Confidence labels.** Every claim that could end up on the site gets one:
- **Confirmed**: printed in a factory catalog, manufacturer page, or recognized price guide (Standard Catalog, Gun Digest, Blue Book), or shown in an auction lot or photo with the factory marking.
- **Likely**: several independent owner, collector, or forum reports that agree, but no catalog page found yet.
- **Rumor**: a single mention, a secondhand quote, or evidence that points to a conversion, a shot-out bore, or a mix-up.

Only **confirmed** claims go on the site as fact. Likely items can appear when they're labeled as such ("reported by owners").

**How to cite.**
- Link the exact page (an auction lot, catalog page, forum thread, or product page), not a site's home page.
- Name the source and add a date when it has one, e.g. `[Rock Island Auction lot 3498 (25 Aug 2024)](https://...)`.
- For a book or price guide, give the title, publisher, year, and entry name, plus a link to a scan if one is public.
- Quote short phrases when the exact wording matters, such as a barrel stamp.
- **Link to sources. Don't commit downloaded PDFs, scans, or page dumps.** Keep the repo small, and respect the original publishers.

**Prices are dated snapshots.** Write the date, the source, and whether a price is a sale, an asking price, an estimate, or a guide value. Old guide values (a 2008 or 2011 edition) are history, not today's market. Nothing here is an appraisal.

**"Searched, nothing found" is not proof.** When a search turns up no evidence, say what was searched and that nothing turned up. Never write that a model or event "never existed" unless a source says so.

**Conversions and look-alikes.** Separate factory production from aftermarket work (bored-out or polished-out barrels, re-barrels, shot-out rifling). If a gun is related but doesn't qualify (rifled, or a different cartridge such as 9mm Flobert), label it that way.

**Times.** Use dates in America/New_York unless a source gives its own time zone.

**Scope.** This is the same club scope as the rest of the repo: history, collecting, games, targets, and costs. No gunsmithing instructions, conversion how-tos, or ammunition making.
