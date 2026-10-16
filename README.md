# Birzum Admin

The super-admin panel for Birzum nasiya (BNPL): the web app the Birzum team uses to run the platform behind the merchant and client mobile apps. Design prototype: React front end with sample data, no backend.

## Stack

- React 19, TypeScript, Vite
- Tailwind CSS v4 (design tokens in `src/shared/styles/index.css`, the same as the mobile apps)
- React Router, lucide-react icons
- oxlint, Prettier

## Commands

```bash
npm install
npm run dev        # local dev server
npm run build      # type-check and production build
npm run lint
npm run format
```

## Structure

```
src/
  app/            App shell: router, sidebar groups (nav.ts), layouts
    layouts/      AdminLayout (sidebar + top bar), Sidebar, Topbar
  entities/       Business data shared by several pages (add when needed)
  features/       One folder per sidebar page
  shared/         Used by more than one feature
    ui/           Button, fields, PageHeader, StatusBadge, EmptyState...
    i18n/         Uzbek and Russian strings, useI18n
    lib/          cn, format, createStore, toast
    config/       Route paths
    styles/       Tailwind entry and design tokens
    theme/        Light / dark / system
```

## Rules

- Read [DESIGN.md](DESIGN.md) before building a page.
- Features import from `entities` and `shared`, never from each other. `entities` imports only from `shared`.
- Import with the `@/` alias.
- Colours, fonts and radii come from the tokens. Use role tokens (`bg-primary`, `text-ink-muted`) so the dark theme keeps working.
- Every user-facing string goes through `t()`; add it to both languages in `src/shared/i18n/dictionaries.ts`.
