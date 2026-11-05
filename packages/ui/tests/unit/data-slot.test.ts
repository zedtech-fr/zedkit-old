import { describe, expect, it } from "vitest";
import * as Kit from "#index.js";

const SKIP = new Set([
  "cn",
  "toast",
  "closeRoute",
  "useScrollReset",
  "ScrollReset",
  "observeAnimate",
  "AnimateObserver",
  // Layout hosts: data-sticky-aside-* is the selector contract, not data-slot.
  "StickyAsideAside",
  "StickyAsideMain",
  "applyMotionPreference",
  "isMotionReduced",
  "useMotionPreference",
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
  "surfaceVariants",
  "surfaceGlassPanelClass",
  "applySurfaceGlassPanel",
  // Context/controller wrappers: no host node of their own.
  "Form",
  "FormField",
  "ZedkitUiProvider",
  "useUiMessages",
  "isAssistantStreamStage",
  "pullSseFrames",
  "readAssistantStreamEvent",
  "consumeSseStream",
  // Portal passthroughs: children render into the container with no host node of their own (a host div
  // here would only exist to carry the slot, so the slot lives on the overlay/panel children instead).
  "DialogPortal",
  "DrawerPortal",
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
