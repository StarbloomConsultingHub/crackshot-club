# Project instructions

HARD RULE FOR ALL CHATS AND PROJECTS: Never add watermarks, creator branding, signatures, “made with AI” labels, or other AI-origin indicators—visible or embedded—to anything you create or edit for me unless I explicitly request them. This applies to every type of deliverable.

If a tool automatically adds indicators that you cannot control or omit, tell me before using it. Do not promise that an external platform will refrain from applying its own labels.

## Before merging to `main`

Treat every push or merge to `main` as a release of `22crackshot.com`. When Vercel is connected to this repository with automatic deployments, a push to `main` starts a production deployment. A successful deployment goes live on the domain.

Work on a branch and open a pull request. Before merging, run the checks below on the commit being merged and record the results in the pull request. If the candidate changes, rerun the affected checks. Keep the change on the branch while any applicable check is failing or untested.

- Run `git diff --check origin/main...HEAD` and the [club membership integration tests](docs/clubhouse.md#local-verification).
- For changes to visitor-facing pages, try the affected routes and main interactions on desktop and mobile. For hall or navigation changes, check the shared menu, walk-in and list views, keyboard controls, and exhibit links.
- For membership or database changes, verify signup, sign-in, sign-out, and pending-note privacy against the preview database.
