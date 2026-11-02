import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { DOCS_OMITTED_REDIRECTS } from "./docs-omitted-needs.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const outRoot = join(here, "..", "out");

function redirectHtml(target) {
  const safe = target.replace(/"/g, "&quot;");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0;url=${safe}">
<link rel="canonical" href="${safe}">
<title>Redirect</title>
<script>location.replace(${JSON.stringify(target)})</script>
</head>
<body><p><a href="${safe}">Continue</a></p></body>
</html>
`;
}

export function writeDocsOmittedRedirectStubs(outDir = outRoot) {
  for (const [pathname, target] of Object.entries(DOCS_OMITTED_REDIRECTS)) {
    const rel = `${pathname.replace(/^\//, "")}.html`;
    const file = join(outDir, rel);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, redirectHtml(target), "utf8");
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeDocsOmittedRedirectStubs();
}
