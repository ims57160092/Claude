# claude-web

React + TypeScript web app built with [Vite](https://vite.dev/) and styled with [Tailwind CSS](https://tailwindcss.com/).

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
  App.tsx         Root component
  App.test.tsx    Example component test
  main.tsx        Entry point
  test/setup.ts   Test setup (jest-dom matchers)
public/           Static assets served as-is
```

CI (`.github/workflows/ci.yml`) runs lint, format check, tests and build on every push to `main` and on pull requests.
