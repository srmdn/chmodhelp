import { Hono } from "hono";
import { parseChmod, type ParsedChmod, type Permission } from "./chmod";

const app = new Hono();

const EXAMPLES = [
  { value: "755", label: "directory / exec" },
  { value: "644", label: "standard file" },
  { value: "600", label: "private file" },
  { value: "777", label: "world-writable" },
  { value: "-rwxr-xr-x", label: "ls format" },
];

function Layout({ children, title }: { children: any; title?: string }) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title ? `${title} — chmodhelp` : "chmodhelp"}</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-white text-slate-900 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}

function Cell({ on, label }: { on: boolean; label: string }) {
  return (
    <div
      class={`flex flex-col items-center justify-center rounded-lg py-4 px-2 gap-1 ${
        on ? "bg-green-50 border border-green-200" : "bg-slate-50 border border-slate-200"
      }`}
    >
      <span class={`text-lg font-bold ${on ? "text-green-600" : "text-slate-300"}`}>
        {on ? "✓" : "✗"}
      </span>
      <span class={`text-xs font-medium ${on ? "text-green-700" : "text-slate-400"}`}>
        {label}
      </span>
    </div>
  );
}

function PermRow({ label, perm, symbolic }: { label: string; perm: Permission; symbolic: string }) {
  return (
    <div class="contents">
      <div class="flex items-center">
        <span class="text-sm font-semibold text-slate-700 w-16">{label}</span>
        <code class="text-xs font-mono text-slate-400">{symbolic}</code>
      </div>
      <Cell on={perm.read} label="read" />
      <Cell on={perm.write} label="write" />
      <Cell on={perm.execute} label="execute" />
    </div>
  );
}

function PermGrid({ result }: { result: ParsedChmod }) {
  const { owner, group, other, symbolic } = result;
  return (
    <div class="grid grid-cols-[1fr_1fr_1fr_1fr] gap-2 items-center">
      {/* Header row */}
      <div />
      <div class="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest">Read</div>
      <div class="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest">Write</div>
      <div class="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest">Execute</div>

      <PermRow label="Owner" perm={owner} symbolic={symbolic.slice(0, 3)} />
      <PermRow label="Group" perm={group} symbolic={symbolic.slice(3, 6)} />
      <PermRow label="Others" perm={other} symbolic={symbolic.slice(6, 9)} />
    </div>
  );
}

function Result({ result }: { result: ParsedChmod }) {
  return (
    <div class="space-y-6">
      {/* Octal + symbolic + common name */}
      <div class="flex items-center gap-3 flex-wrap">
        <code class="bg-slate-900 text-amber-400 px-4 py-2 rounded-lg font-mono text-xl font-bold">
          {result.octal}
        </code>
        <code class="bg-slate-100 text-slate-600 px-3 py-2 rounded-lg font-mono text-sm">
          {result.symbolic}
        </code>
        {result.commonName && (
          <span class="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-lg text-sm font-medium">
            {result.commonName}
          </span>
        )}
      </div>

      {/* Permission grid */}
      <PermGrid result={result} />

      {/* Summary */}
      <div class="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
        <p class="text-slate-800 leading-relaxed">{result.summary}</p>
      </div>

      {/* Use cases */}
      {result.useCases.length > 0 && (
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Common use cases
          </p>
          <ul class="space-y-1">
            {result.useCases.map((uc) => (
              <li class="flex items-start gap-2 text-sm text-slate-600">
                <span class="text-slate-300 mt-0.5">–</span>
                {uc}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

app.get("/", (c) => {
  const input = c.req.query("p") ?? "";
  const result = input ? parseChmod(input) : null;

  return c.html(
    <Layout title={input || undefined}>
      <div class="max-w-2xl mx-auto px-4 py-12">
        <div class="mb-8">
          <h1 class="text-2xl font-bold tracking-tight">chmodhelp</h1>
          <p class="text-slate-500 mt-1 text-sm">
            Decode any Unix file permission — octal or ls format.
          </p>
        </div>

        <form method="GET" action="/" class="flex gap-2 mb-6">
          <input
            type="text"
            name="p"
            value={input}
            placeholder="e.g. 755 or -rwxr-xr-x"
            spellcheck="false"
            autocomplete="off"
            class="flex-1 font-mono bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
          />
          <button
            type="submit"
            class="px-5 py-3 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Explain
          </button>
        </form>

        {!input && (
          <div class="flex flex-wrap gap-2 mb-8">
            {EXAMPLES.map(({ value, label }) => (
              <a
                href={`/?p=${encodeURIComponent(value)}`}
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                <span class="font-mono text-xs text-slate-700">{value}</span>
                <span class="text-xs text-slate-400">{label}</span>
              </a>
            ))}
          </div>
        )}

        {result && !result.valid && (
          <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p class="text-sm text-red-700">
              <span class="font-semibold">Invalid input:</span> {result.error}
            </p>
          </div>
        )}

        {result && result.valid && <Result result={result} />}

        <footer class="mt-16 pt-6 border-t border-slate-100">
          <p class="text-xs text-slate-400">
            Made by{" "}
            <a href="https://github.com/srmdn" class="underline hover:text-slate-600">
              srmdn
            </a>
            .
          </p>
        </footer>
      </div>
    </Layout>
  );
});

export default {
  port: 3000,
  fetch: app.fetch,
};
