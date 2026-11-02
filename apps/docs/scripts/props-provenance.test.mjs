import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";
import { readDeclaredProps } from "../lib/declared-props.mjs";
import { DEFAULT_PROPS_PRIORITY, partitionPropsEntries } from "../lib/props-priority.mjs";

const basePath = join(import.meta.dirname, "..", "..", "..", "packages", "ui", "src");
const tsconfigPath = join(import.meta.dirname, "..", "tsconfig.json");

/** Partition the real kit source exactly as the props table does. */
async function split(file, name, priority = DEFAULT_PROPS_PRIORITY) {
  const [doc] = await readDeclaredProps({ file, name, basePath, tsconfigPath });
  const { primary, inherited } = partitionPropsEntries(doc.entries, priority);
  return { kit: primary.map((e) => e.name), inherited: inherited.map((e) => e.name) };
}

test("Stack exposes its own direction and gap although SVG also has a direction attribute", async () => {
  const { kit, inherited } = await split("layout.tsx", "StackProps");
  assert.deepEqual(kit.sort(), ["direction", "gap"]);
  assert.ok(inherited.includes("onClick") && inherited.includes("id"));
  assert.ok(!inherited.includes("direction") && !inherited.includes("gap"));
});

test("Container exposes width and gutter although width is a native attribute name elsewhere", async () => {
  const { kit, inherited } = await split("layout.tsx", "ContainerProps");
  assert.deepEqual(kit.sort(), ["gutter", "width"]);
  assert.ok(!inherited.includes("width"));
});

test("Textarea invents nothing: dirName, rows and wrap stay inherited", async () => {
  const { kit, inherited } = await split("textarea.tsx", "TextareaProps");
  assert.deepEqual(kit, []);
  for (const name of ["dirName", "rows", "wrap"]) assert.ok(inherited.includes(name), `${name} is inherited`);
});

test("a required kit prop stays visible next to the inherited title", async () => {
  const { kit, inherited } = await split("icon-button.tsx", "IconButtonProps");
  assert.ok(kit.includes("label"));
  assert.ok(inherited.includes("title"));
});

test("Button keeps variant, size and asChild first", async () => {
  const { kit } = await split("button.tsx", "ButtonProps");
  assert.deepEqual(kit.slice(0, 3), ["variant", "size", "asChild"]);
});

test("a wrapped library's own props stay visible (Form: render and shouldUnregister)", async () => {
  const [doc] = await readDeclaredProps({ file: "form.tsx", name: "FormFieldProps", basePath, tsconfigPath });
  const names = doc.entries.filter((entry) => entry.origin === "kit").map((entry) => entry.name);
  assert.ok(names.includes("render"), "render is react-hook-form's, shown as an option");
  assert.ok(names.includes("name"));
});
