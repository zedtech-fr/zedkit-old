import { describe, expect, it } from "vitest";
import * as Kit from "#index.js";

const SKIP = new Set([
  "cn",
  "toast",
  "closeRoute",
  "applyIdentity",
  "discardCustomIdentity",
  "applyCustomIdentity",
  "applyIdentityTokenSheet",
  "tokensToCss",
  "tokensToCssVars",
  "parseIdentityTokens",
  "suggestIdentityTokens",
  "identityContrastWarnings",
  "identityContrastTokenLabel",
  "keepIdentityDarkKeys",
  "withIdentityDarkPair",
  "isPresetId",
  "isNamedIdentityId",
  "createDataTableColumns",
  "useFormField",
  "useValidatedForm",
  "useOnlineStatus",
  "useIdentity",
  "usePortalContainer",
  "alertVariants",
  "badgeVariants",
  "buttonVariants",
  "containerVariants",
  "headingVariants",
  "stackVariants",
  "textVariants",
  // Context/controller wrappers: no host node of their own.
  "Form",
  "FormField",
  "ZedkitUiProvider",
  "useUiMessages",
]);
// Root/portal re-exports still carry data-slot in source (kit convention).
// DOM hosts are also checked in primitives.test.tsx (Button, Input).

const names = Object.entries(Kit)
  .filter(([name, value]) => typeof value === "function" && !SKIP.has(name))
  .map(([name]) => name);

describe("exported roots expose data-slot", () => {
  it("covers the public component exports", () => {
    expect(names.length).toBeGreaterThan(40);
  });

  it.each(names)("%s source includes data-slot", (name) => {
    const value = Kit[name as keyof typeof Kit];
    expect(Function.prototype.toString.call(value)).toContain("data-slot");
  });
});
