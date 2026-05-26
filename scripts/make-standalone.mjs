import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");

const index = await readFile(join(dist, "index.html"), "utf-8");
const cssHref = index.match(/href="\.\/assets\/([^"]+\.css)"/)?.[1];
const jsSrc = index.match(/src="\.\/assets\/([^"]+\.js)"/)?.[1];

if (!cssHref || !jsSrc) {
  throw new Error("Cannot find built CSS or JS asset in dist/index.html");
}

const css = await readFile(join(dist, "assets", cssHref), "utf-8");
const js = await readFile(join(dist, "assets", jsSrc), "utf-8");

const html = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Time-to-Market Dashboard</title>
    <style>${css}</style>
  </head>
  <body>
    <div id="root"></div>
    <script>${js}</script>
  </body>
</html>
`;

await writeFile(join(dist, "dashboard-standalone.html"), html, "utf-8");
await writeFile(join(dist, "index.html"), html, "utf-8");
console.log("Created standalone dist/index.html and dist/dashboard-standalone.html");
