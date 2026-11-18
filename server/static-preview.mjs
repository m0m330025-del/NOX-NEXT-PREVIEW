import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";

const root = process.cwd();
const blocked = new Set([".git", ".github", "db", "docs", "functions", "scripts", "tests", "node_modules"]);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg"
};

const server = createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Allow": "GET, HEAD" }).end("Method Not Allowed");
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.writeHead(400).end("Bad Request");
    return;
  }

  if (pathname === "/") pathname = "/index.html";
  const parts = pathname.split("/").filter(Boolean);
  if (parts.some(part => part.startsWith(".") || blocked.has(part))) {
    res.writeHead(404).end("Not Found");
    return;
  }

  const file = resolve(root, "." + pathname);
  if (file !== root && !file.startsWith(root + sep)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404).end("Not Found");
    return;
  }

  const type = mime[extname(file).toLowerCase()];
  if (!type) {
    res.writeHead(404).end("Not Found");
    return;
  }

  res.writeHead(200, {
    "Content-Type": type,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Cache-Control": "no-store"
  });
  if (req.method === "HEAD") res.end();
  else createReadStream(file).pipe(res);
});

const port = Number(process.env.PORT || 3000);
server.listen(port, "0.0.0.0", () => {
  console.log(`NOX preview static server listening on ${port}`);
});
