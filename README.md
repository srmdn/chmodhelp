# chmodhelp

Decode any Unix file permission in plain English.

![chmodhelp screenshot](screenshot.png)

## What it does

- Supports octal (`755`, `0644`) and ls format (`-rwxr-xr-x`)
- Visual permission grid — owner, group, others × read, write, execute
- Recognized permission name (e.g. "Standard file", "Private file")
- Plain English summary of who can do what
- Common use cases for well-known permission sets

## Stack

- **Runtime** — [Bun](https://bun.sh)
- **Framework** — [Hono](https://hono.dev) with JSX SSR
- **Styling** — Tailwind CSS (CDN)

## Run locally

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## License

MIT
