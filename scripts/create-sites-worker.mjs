import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';

await mkdir('dist/foodinstagram', { recursive: true });
await cp('dist/index.html', 'dist/foodinstagram/index.html');

await rm('dist/client', { recursive: true, force: true });
await mkdir('dist/client', { recursive: true });

const entries = await readdir('dist', { withFileTypes: true });
await Promise.all(
  entries
    .filter((entry) => entry.name !== 'client' && entry.name !== 'server')
    .map((entry) => cp(`dist/${entry.name}`, `dist/client/${entry.name}`, { recursive: true }))
);

await mkdir('dist/server', { recursive: true });
await mkdir('dist/.openai', { recursive: true });
await cp('.openai', 'dist/.openai', { recursive: true });
const workerSource = await readFile('worker/index.js', 'utf8');
await writeFile('dist/server/index.js', workerSource);
