// Local preview of public/ with the same clean-URL rules as the live host: node tools/serve.mjs [port]
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('../public/', import.meta.url).pathname;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain' };

export function serve(port = 4321) {
  return new Promise((ok) => {
    const server = createServer((req, res) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      if (url.endsWith('.html') && url !== '/404.html') { res.writeHead(301, { Location: url.replace(/(index)?\.html$/, '').replace(/([^/])$/, '$1/') }); return res.end(); }
      let file = normalize(join(ROOT, url));
      if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
      if (existsSync(file) && statSync(file).isDirectory()) {
        if (!url.endsWith('/')) { res.writeHead(301, { Location: url + '/' }); return res.end(); }
        file = join(file, 'index.html');
      }
      if (!existsSync(file)) { res.writeHead(404, { 'Content-Type': TYPES['.html'] }); return res.end(readFileSync(join(ROOT, '404.html'))); }
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
      res.end(readFileSync(file));
    }).listen(port, () => ok(server));
  });
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const port = +process.argv[2] || 4321;
  await serve(port);
  console.log(`http://localhost:${port}`);
}
