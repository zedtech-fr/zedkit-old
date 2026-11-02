import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, "..");
const uiSrc = join(app, "../../packages/ui/src");
const factsSrc = readFileSync(join(app, "ui/home/home-identity-facts.ts"), "utf8");
const identityData = readFileSync(join(uiSrc, "identity-data.ts"), "utf8");
const identitiesCss = readFileSync(join(uiSrc, "identities.css"), "utf8");

const SHIPPED = ["mist", ...readdirSync(join(uiSrc, "identities"))
  .filter((file) => file.endsWith(".css"))
  .map((file) => file.replace(/\.css$/, ""))];

function block(css, selector) {
  const start = css.indexOf(selector);
  assert.notEqual(start, -1, `missing selector ${selector}`);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    else if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(open, i + 1);
    }
  }
  return "";
}

function token(css, name) {
  const match = css.match(new RegExp(`${name}:\\s*([^;]+);`));
  return match?.[1]?.trim();
}

function firstQuotedFont(value) {
  const match = value?.match(/"([^"]+)"/);
  return match?.[1]?.replace(/ Variable$/, "") ?? value;
}

function factsBlock(id) {
  const match = factsSrc.match(new RegExp(`${id}: \\{([\\s\\S]*?)\\n  \\},`));
  assert.ok(match, `facts missing for ${id}`);
  return match[1];
}

function field(blockSrc, name) {
  const match = blockSrc.match(new RegExp(`${name}: "([^"]+)"`));
  return match?.[1];
}

function paletteHsl(blockSrc, tokenName) {
  const match = blockSrc.match(new RegExp(`${tokenName}: "([^"]+)"`));
  return match?.[1];
}

test("every shipped identity id has facts", () => {
  const dataIds = [...identityData.matchAll(/id: "([a-z]+)"/g)].map((match) => match[1]);
  for (const id of SHIPPED) {
    assert.equal(factsSrc.includes(`id: "${id}"`), true, `facts id missing: ${id}`);
    assert.equal(dataIds.includes(id), true, `identity-data missing: ${id}`);
  }
  assert.equal(SHIPPED.length, 6);
});

test("facts spacing, radius, border and palette match identity CSS", () => {
  const mistCss = identitiesCss.slice(identitiesCss.indexOf("Scoped mist resets the stock tokens."));
  const cssById = {
    mist: block(mistCss, '[data-identity-scope][data-identity="mist"]'),
    press: block(readFileSync(join(uiSrc, "identities/press.css"), "utf8"), '[data-identity="press"]'),
    tide: block(readFileSync(join(uiSrc, "identities/tide.css"), "utf8"), '[data-identity="tide"]'),
    volt: block(readFileSync(join(uiSrc, "identities/volt.css"), "utf8"), '[data-identity="volt"]'),
    maison: block(readFileSync(join(uiSrc, "identities/maison.css"), "utf8"), '[data-identity="maison"]'),
    glass: block(readFileSync(join(uiSrc, "identities/glass.css"), "utf8"), '[data-identity="glass"]'),
  };

  for (const id of SHIPPED) {
    const css = cssById[id];
    const facts = factsBlock(id);
    assert.equal(field(facts, "spacing"), token(css, "--spacing"), `${id} spacing`);
    assert.equal(field(facts, "borderWidth"), token(css, "--zk-border-width"), `${id} border`);
    assert.equal(field(facts, "radius"), token(css, "--radius"), `${id} radius`);
    assert.equal(paletteHsl(facts, "background"), token(css, "--background"), `${id} background`);
    assert.equal(paletteHsl(facts, "primary"), token(css, "--primary"), `${id} primary`);
    assert.equal(paletteHsl(facts, "accent"), token(css, "--accent"), `${id} accent`);
    const fontCss =
      id === "mist"
        ? block(identitiesCss, '[data-identity="mist"]')
        : css;
    const body = firstQuotedFont(token(fontCss, "--zk-font-sans"));
    const displayRaw = token(fontCss, "--zk-font-display");
    const display = displayRaw?.startsWith("var(") ? body : firstQuotedFont(displayRaw);
    assert.equal(field(facts, "bodyFont"), body, `${id} body font`);
    assert.equal(field(facts, "displayFont"), display, `${id} display font`);
  }
});
