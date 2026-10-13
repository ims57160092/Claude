# Planner

A planner for the browser, designed for iPad and Apple Pencil. Built with React, TypeScript, [Vite](https://vite.dev/) and [Tailwind CSS](https://tailwindcss.com/).

- **Month, week and day views.** Tap any day to open it.
- **Each day has** a task list (with optional times), a typed note, and a handwriting page.
- **Handwriting** supports pen (pressure-sensitive), highlighter and stroke eraser, with undo/redo. Finger input scrolls the page unless "เขียนด้วยนิ้ว" (draw with finger) is turned on, so your palm never leaves marks.
- **Storage** is in the browser's IndexedDB on the device; nothing is sent to a server. Use "สำรองข้อมูล" (back up) to download a `.json` file and "นำเข้า" (import) to restore it.

On iPad, open the site in Safari and use **Share → Add to Home Screen**. It then runs full screen, and Safari is far less likely to clear its stored data.

## Getting started

```bash
npm install
npm run dev
```

## Scripts

| Command                | Description                         |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Start the dev server with HMR       |
| `npm run build`        | Type-check and build for production |
| `npm run preview`      | Preview the production build        |
| `npm test`             | Run tests once (Vitest)             |
| `npm run test:watch`   | Run tests in watch mode             |
| `npm run lint`         | Lint with oxlint                    |
| `npm run format`       | Format with Prettier                |
| `npm run format:check` | Check formatting                    |

## Project structure

```
src/
  App.tsx              App shell: header, navigation, view switching
  components/          Month, week and day views, task list, handwriting canvas
  lib/date.ts          Date keys, week/month grids, Thai date formatting
  lib/storage.ts       IndexedDB storage, backup export/import
  lib/hooks.ts         React hooks for loading and autosaving days
  test/setup.ts        Test setup (fake IndexedDB, jsdom shims)
public/           Static assets served as-is
```

CI (`.github/workflows/ci.yml`) runs lint, format check, tests and build on every push to `main` and on pull requests.

## Deployment

`.github/workflows/deploy.yml` builds the app and pushes `dist/` to the `gh-pages` branch on every push to `main` (it can also be run manually from the Actions tab). GitHub Pages serves that branch at `https://<owner>.github.io/<repo>/`; the workflow passes that sub-path to Vite with `--base`.

If the site does not appear after the first deploy, set **Settings → Pages → Source** to **Deploy from a branch**, branch `gh-pages`, folder `/ (root)`.
