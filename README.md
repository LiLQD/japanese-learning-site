# Japanese Learning Site

A web application for learning Japanese.

## Stack

- React + TypeScript + Vite
- Express + TypeScript
- Zod
- PostgreSQL
- pnpm monorepo

## Project Structure

```text
apps/
  web/       # Frontend
  api/       # Backend API

packages/
  shared/    # Shared schemas and types
```

## Development

Install dependencies:

```bash
pnpm install
```

Start the applications:

```bash
pnpm dev
```

Start PostgreSQL:

```bash
docker compose up -d
```

## Checks

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Status

Early development. Core learning features are not implemented yet.
