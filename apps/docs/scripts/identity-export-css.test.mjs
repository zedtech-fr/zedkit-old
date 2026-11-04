import assert from "node:assert/strict";
import test from "node:test";

import { identityPresets, tokensToCss } from "@zedtech/zedkit-ui";

import { identityExportCss, IDENTITY_UI_INSTALL_COMMAND } from "../lib/identity-export-css.ts";

test("identityExportCss matches editor export scope", () => {
  const tokens = identityPresets.mist;
  assert.equal(identityExportCss(tokens), tokensToCss(tokens, ":root"));
});

test("IDENTITY_UI_INSTALL_COMMAND is the UI package add line", () => {
  assert.equal(IDENTITY_UI_INSTALL_COMMAND, "pnpm add @zedtech/zedkit-ui");
});
