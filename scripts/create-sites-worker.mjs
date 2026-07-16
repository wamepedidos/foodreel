import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';

await rm('dist/client', { recursive: true, force: true });
await mkdir('dist/client', { recursive: true });

const entries = await readdir('dist', { withFileTypes: true });
await Promise.all(
  entries
    .filter((entry) => entry.name !== 'client' && entry.name !== 'server')
    .map((entry) => cp(`dist/${entry.name}`, `dist/client/${entry.name}`, { recursive: true }))
);

const workerSource = `const IMMUTABLE_ASSET = /\\.[a-z0-9]+$/i;

function withCacheHeaders(response) {
  const headers = new Headers(response.headers);
  if (!headers.has("cache-control")) {
    headers.set("cache-control", "public, max-age=31536000, immutable");
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const assetResponse = await env.ASSETS.fetch(request);

    if (assetResponse.status !== 404) {
      return IMMUTABLE_ASSET.test(url.pathname) ? withCacheHeaders(assetResponse) : assetResponse;
    }

    if (request.method === "GET" && !IMMUTABLE_ASSET.test(url.pathname)) {
      return env.ASSETS.fetch(new Request(new URL("/index.html", request.url), request));
    }

    return assetResponse;
  }
};
`;

await mkdir('dist/server', { recursive: true });
await writeFile('dist/server/index.js', workerSource);
