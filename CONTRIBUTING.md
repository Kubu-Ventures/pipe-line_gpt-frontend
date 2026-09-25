# Contributing to the PipelineGPT frontend

The project-wide guide (ground rules, commit conventions, PR process, releases) is in the
[backend repository's CONTRIBUTING.md](https://github.com/Kubu-Ventures/pipe-line_gpt-backend/blob/main/CONTRIBUTING.md).
Frontend specifics:

> **Code contributions are not accepted yet** (the project is dual-licensed, so the author must hold the rights to all code). Please open an issue for bugs and ideas instead of a pull request.

## Setup

```bash
cd frontend
npm ci
cp .env.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:8000, NEXTAUTH_SECRET=...
npm run dev                      # http://localhost:3000
```

Run the backend locally as described in its README.

## Before opening a PR

```bash
npx tsc --noEmit
npm run build
```

- **Translations:** every user-facing string goes through `next-intl`. Add new keys to **all 10** files in `messages/`; ask in the PR if you need help translating.
- **Pages:** the live routes are under `app/[locale]/`. Several of them re-export components from the top-level `app/<page>` folders.
- **API URLs:** browser code must use `NEXT_PUBLIC_API_URL` (relative `/backend` in the Docker image). Server-side code (`lib/auth.ts`) uses `API_INTERNAL_URL`.
- **Engineer review:** never render an answer for an operator before the backend marks it delivered.

## License

Copyright (C) 2026 Collins Kubu. Licensed under the [GNU AGPL-3.0](LICENSE). Commercial licenses (for use outside the AGPL's terms) and support are available from the author.
