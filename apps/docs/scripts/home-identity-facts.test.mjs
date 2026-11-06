import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, "..");
const uiSrc = join(app, "../../packages/ui/src");
const factsSrc = readFileSync(join(app, "ui/home/home-identity-facts.ts"), "utf8");
const identityData = readFileSync(join(uiSrc, "identity-data.ts"), "utf8");
const identitiesCss = readFileSync(join(uiSrc, "identities.css"), "utf8");

/** Home shows three looks only (`IDENTITY_IDS`); other kit identities stay off the home facts table. */
const IDS_MATCH = factsSrc.match(/export const IDENTITY_IDS = \[([^\]]+)\]/);
assert.ok(IDS_MATCH, "IDENTITY_IDS export missing");
const SHIPPED = [...IDS_MATCH[1].matchAll(/"([a-z]+)"/g)].map((m) => m[1]);

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

function factsRecord(id) {
  const match = factsSrc.match(new RegExp(`${id}: \\{([^}]+)\\}`));
  assert.ok(match, `facts missing for ${id}`);
  return match[1];
}

function field(blockSrc, name) {
  const match = blockSrc.match(new RegExp(`${name}: "([^"]+)"`));
  return match?.[1];
}

test("home ships exactly the three looks in IDENTITY_IDS", () => {
  assert.deepEqual(SHIPPED, ["mist", "press", "maison"]);
});

test("every home identity id has facts and identity-data", () => {
  const dataIds = [...identityData.matchAll(/id: "([a-z]+)"/g)].map((match) => match[1]);
  for (const id of SHIPPED) {
    assert.equal(factsSrc.includes(`id: "${id}"`), true, `facts id missing: ${id}`);
    assert.equal(dataIds.includes(id), true, `identity-data missing: ${id}`);
    const rec = factsRecord(id);
    assert.ok(field(rec, "label"), `${id} label`);
    assert.ok(field(rec, "type"), `${id} type`);
    assert.ok(field(rec, "shape"), `${id} shape`);
  }
});

test("home look CSS still defines spacing, radius, border and fonts", () => {
  const mistCss = identitiesCss.slice(identitiesCss.indexOf("Scoped mist resets the stock tokens."));
  const cssById = {
    mist: block(mistCss, '[data-identity-scope][data-identity="mist"]'),
    press: block(readFileSync(join(uiSrc, "identities/press.css"), "utf8"), '[data-identity="press"]'),
    maison: block(readFileSync(join(uiSrc, "identities/maison.css"), "utf8"), '[data-identity="maison"]'),
  };

  for (const id of SHIPPED) {
    const css = cssById[id];
    assert.ok(token(css, "--spacing"), `${id} spacing token`);
    assert.ok(token(css, "--zk-border-width"), `${id} border token`);
    assert.ok(token(css, "--radius"), `${id} radius token`);
    const fontCss = id === "mist" ? block(identitiesCss, '[data-identity="mist"]') : css;
    assert.ok(firstQuotedFont(token(fontCss, "--zk-font-sans")), `${id} body font`);
  }
});
