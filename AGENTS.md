# Project instructions

HARD RULE FOR ALL CHATS AND PROJECTS: Never add watermarks, creator branding, signatures, “made with AI” labels, or other AI-origin indicators—visible or embedded—to anything you create or edit for me unless I explicitly request them. This applies to every type of deliverable.

If a tool automatically adds indicators that you cannot control or omit, tell me before using it. Do not promise that an external platform will refrain from applying its own labels.

## Before merging to `main`

Treat every merge to `main` as a release candidate for `22crackshot.com`. Merging does **not** deploy by itself: the Vercel project's Ignored Build Step skips Git-triggered builds. Production is a manual direct upload of the `site/` folder to the `crackshot-club` Vercel project, done only after review and Darren's approval. Keep `main` matching what is live, and deploy soon after each approved merge so the two don't drift. If automatic Git deployments are ever turned on, update this section.

Work on a branch and open a pull request. Before merging, run the checks below on the commit being merged and record the results in the pull request. If the candidate changes, rerun the affected checks. Keep the change on the branch while any applicable check is failing or untested.

- Run `git diff --check origin/main...HEAD` and the [club membership integration tests](docs/clubhouse.md#local-verification).
- For changes to visitor-facing pages, try the affected routes and main interactions on desktop and mobile. For hall or navigation changes, check the shared menu, walk-in and list views, keyboard controls, and exhibit links.
- For membership or database changes, verify signup, sign-in, sign-out, and pending-note privacy against the preview database.

## Research notes

Sourced research behind site content lives in `research/`, outside `site/`, so it is never deployed. Follow [research/README.md](research/README.md): label each claim confirmed, likely, or rumor; link exact sources; date every price; and don't commit downloaded PDFs. Put only confirmed facts on the site, and check the relevant research note before changing hall exhibits or challenge rules.
