import { readFileSync } from "node:fs";
import { join } from "node:path";

const STYLES_REL = "packages/ui/src/styles.css";

function varFromBlock(block, name) {
  const match = block.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`styles.css: missing --${name} in expected block`);
  return match[1].trim();
}

function blockBefore(css, opener, endMarker) {
  const start = css.indexOf(opener);
  if (start < 0) throw new Error(`styles.css: missing ${opener}`);
  const brace = css.indexOf("{", start);
  const end = css.indexOf(endMarker, brace + 1);
  const close = css.lastIndexOf("}", end > 0 ? end : css.length);
  return css.slice(brace + 1, close);
}

function rootThemeBlock(css) {
  return blockBefore(css, ":root", "\n.dark");
}

function darkThemeBlock(css) {
  return blockBefore(css, "\n.dark {", "\n@theme");
}

function themeInlineBlock(css) {
  return blockBefore(css, "@theme inline", "\n@layer");
}

function keyframesBlock(css, name) {
  const opener = `@keyframes ${name}`;
  const start = css.indexOf(opener);
  if (start < 0) throw new Error(`styles.css: missing ${opener}`);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  throw new Error(`styles.css: unclosed ${opener}`);
}

function expectedCheckDrawCss(css) {
  const body = keyframesBlock(css, "zk-check-draw");
  const fromMatch = body.match(/from\s*\{([^}]+)\}/);
  const toMatch = body.match(/to\s*\{([^}]+)\}/);
  if (!fromMatch || !toMatch) throw new Error("styles.css: zk-check-draw keyframes malformed");
  const pick = (block, prop) => {
    const match = block.match(new RegExp(`${prop}:\\s*([^;]+);`));
    if (!match) throw new Error(`styles.css: zk-check-draw missing ${prop}`);
    return match[1].trim();
  };
  return {
    "@keyframes zk-check-draw": {
      from: { "stroke-dashoffset": pick(fromMatch[1], "stroke-dashoffset") },
      to: { "stroke-dashoffset": pick(toMatch[1], "stroke-dashoffset") },
    },
  };
}

function motionRootBlock(css) {
  const marker = "/*\n * Motion tokens:";
  const start = css.indexOf(marker);
  if (start < 0) throw new Error("styles.css: missing motion tokens block");
  const open = css.indexOf("{", start);
  const close = css.indexOf("\n}", open);
  return css.slice(open + 1, close);
}

function keyframesFromTo(css, name) {
  const body = keyframesBlock(css, name);
  const fromMatch = body.match(/from\s*\{([^}]+)\}/);
  const toMatch = body.match(/to\s*\{([^}]+)\}/);
  if (!fromMatch && !toMatch) throw new Error(`styles.css: ${name} keyframes malformed`);
  const pickProps = (block) => {
    const props = {};
    for (const prop of ["opacity", "transform", "stroke-dashoffset"]) {
      const match = block.match(new RegExp(`${prop}:\\s*([^;]+);`));
      if (match) props[prop] = match[1].trim();
    }
    return props;
  };
  const frame = {};
  if (fromMatch) frame.from = pickProps(fromMatch[1]);
  if (toMatch) frame.to = pickProps(toMatch[1]);
  return frame;
}

function expectedOverlayMotionCss(cssText) {
  return {
    "@keyframes zk-fade-in": keyframesFromTo(cssText, "zk-fade-in"),
    "@keyframes zk-fade-out": keyframesFromTo(cssText, "zk-fade-out"),
    "@keyframes zk-zoom-in": keyframesFromTo(cssText, "zk-zoom-in"),
    "@keyframes zk-zoom-out": keyframesFromTo(cssText, "zk-zoom-out"),
  };
}

function utilityCss(css, name, endMarker) {
  const utility = blockBefore(css, `@utility ${name}`, endMarker);
  const blockMatch = utility.match(/&:[^{]+\{([^}]+)\}/);
  if (!blockMatch) throw new Error(`styles.css: @utility ${name} missing rule block`);
  const inner = blockMatch[1];
  const props = {};
  for (const line of inner.split(";")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const colon = trimmed.indexOf(":");
    if (colon < 0) continue;
    props[trimmed.slice(0, colon).trim()] = trimmed.slice(colon + 1).trim();
  }
  const pseudo = utility.match(/&:[\w-]+/)[0];
  return {
    [`@utility ${name}`]: {
      [pseudo]: props,
    },
  };
}

function expectedFocusRingCss(css) {
  return utilityCss(css, "focus-ring", "\n@utility dialog-center");
}

function expectedFocusRingControlCss(css) {
  return utilityCss(css, "focus-ring-control", "\n@utility button-press");
}

function expectedButtonPressCss(css) {
  const utility = blockBefore(css, "@utility button-press", "\n@utility hit-target");
  const transitionMatch = utility.match(/transition-property:\s*([^;]+);/);
  const durationMatch = utility.match(/transition-duration:\s*([^;]+);/);
  const timingMatch = utility.match(/transition-timing-function:\s*([^;]+);/);
  const activeMatch = utility.match(/&:active:not\(:disabled\)\s*\{([^}]+)\}/);
  if (!transitionMatch || !durationMatch || !timingMatch || !activeMatch) {
    throw new Error("styles.css: @utility button-press malformed");
  }
  const scaleMatch = activeMatch[1].match(/scale:\s*([^;]+);/);
  if (!scaleMatch) throw new Error("styles.css: button-press missing scale");
  return {
    "@utility button-press": {
      "transition-property": transitionMatch[1].trim(),
      "transition-duration": durationMatch[1].trim(),
      "transition-timing-function": timingMatch[1].trim(),
      "&:active:not(:disabled)": {
        scale: scaleMatch[1].trim(),
      },
    },
  };
}

function expectedDialogCenterCss(css) {
  const utility = blockBefore(css, "@utility dialog-center", "\n/* Controls");
  const props = {};
  for (const line of utility.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("&")) continue;
    const colon = trimmed.indexOf(":");
    if (colon < 0) continue;
    props[trimmed.slice(0, colon).trim()] = trimmed.slice(colon + 1).trim().replace(/;$/, "");
  }
  return {
    "@utility dialog-center": props,
  };
}

function expectedVaulCopyCss() {
  return {
    "html [data-vaul-drawer]": {
      "animation-duration": "var(--motion-slow)",
      "transition-duration": "var(--motion-slow)",
    },
    "html [data-vaul-overlay]": {
      "animation-duration": "var(--motion-base)",
    },
    "@media (prefers-reduced-motion: reduce)": {
      "html [data-vaul-drawer], html [data-vaul-overlay]": {
        animation: "none !important",
        transition: "none !important",
      },
    },
  };
}

function expectedCopyThemeItem(cssText) {
  const root = rootThemeBlock(cssText);
  const dark = darkThemeBlock(cssText);
  const motion = motionRootBlock(cssText);
  return {
    cssVars: {
      light: {
        success: varFromBlock(root, "success"),
        warning: varFromBlock(root, "warning"),
        overlay: varFromBlock(root, "overlay"),
      },
      dark: {
        success: varFromBlock(dark, "success"),
        warning: varFromBlock(dark, "warning"),
        overlay: varFromBlock(dark, "overlay"),
      },
      theme: {
        "motion-fast": varFromBlock(motion, "motion-fast"),
        "motion-base": varFromBlock(motion, "motion-base"),
        "motion-slow": varFromBlock(motion, "motion-slow"),
        "ease-enter": varFromBlock(motion, "ease-enter"),
        "ease-exit": varFromBlock(motion, "ease-exit"),
        "zk-press-scale": varFromBlock(motion, "zk-press-scale"),
      },
    },
    css: {
      ...expectedOverlayMotionCss(cssText),
      ...expectedDialogCenterCss(cssText),
      ...expectedButtonPressCss(cssText),
      ...expectedFocusRingControlCss(cssText),
      ...expectedVaulCopyCss(),
    },
  };
}

/** Expected registry `cssVars` / `css` slices derived from the UI theme file. */
export function expectedRegistryThemeFromStyles(cssText) {
  const root = rootThemeBlock(cssText);
  const dark = darkThemeBlock(cssText);
  const theme = themeInlineBlock(cssText);
  return {
    badge: {
      cssVars: {
        theme: {
          "ring-width": varFromBlock(root, "ring-width"),
          "ring-offset-width": varFromBlock(root, "ring-offset-width"),
          "spacing-badge-inline": varFromBlock(theme, "spacing-badge-inline"),
          "spacing-badge-block": varFromBlock(theme, "spacing-badge-block"),
        },
      },
      css: expectedFocusRingCss(cssText),
    },
    drawer: {
      cssVars: {
        light: { overlay: varFromBlock(root, "overlay") },
        dark: { overlay: varFromBlock(dark, "overlay") },
      },
    },
    "status-dot": {
      cssVars: {
        light: {
          success: varFromBlock(root, "success"),
          warning: varFromBlock(root, "warning"),
        },
        dark: {
          success: varFromBlock(dark, "success"),
          warning: varFromBlock(dark, "warning"),
        },
        theme: {
          "spacing-status-dot": varFromBlock(theme, "spacing-status-dot"),
        },
      },
    },
    checkmark: {
      cssVars: {
        theme: {
          "spacing-checkmark": varFromBlock(theme, "spacing-checkmark"),
          "animate-check-draw": varFromBlock(theme, "animate-check-draw"),
        },
      },
      css: expectedCheckDrawCss(cssText),
    },
    "status-label": {
      cssVars: {
        theme: {
          "spacing-status-label-gap": varFromBlock(theme, "spacing-status-label-gap"),
          "spacing-status-label-box": varFromBlock(theme, "spacing-status-label-box"),
          "spacing-icon-sm": varFromBlock(theme, "spacing-icon-sm"),
        },
      },
    },
    "progress-bar": {
      cssVars: {
        theme: {
          "spacing-progress-bar-gap": varFromBlock(theme, "spacing-progress-bar-gap"),
          "spacing-progress-bar-height": varFromBlock(theme, "spacing-progress-bar-height"),
        },
      },
    },
    separator: {
      cssVars: {
        theme: {
          "spacing-separator-thickness": varFromBlock(theme, "spacing-separator-thickness"),
        },
      },
    },
    alert: {
      cssVars: {
        theme: {
          "spacing-alert-inline": varFromBlock(theme, "spacing-alert-inline"),
          "spacing-alert-block": varFromBlock(theme, "spacing-alert-block"),
          "spacing-alert-icon-offset": varFromBlock(theme, "spacing-alert-icon-offset"),
          "spacing-alert-icon-nudge": varFromBlock(theme, "spacing-alert-icon-nudge"),
          "spacing-alert-content-indent": varFromBlock(theme, "spacing-alert-content-indent"),
        },
      },
    },
    typography: {
      cssVars: {
        theme: {
          "spacing-heading-scroll": varFromBlock(theme, "spacing-heading-scroll"),
        },
      },
    },
    "detail-panel": {
      cssVars: {
        theme: {
          "spacing-detail-panel-gap": varFromBlock(theme, "spacing-detail-panel-gap"),
          "spacing-detail-panel-inline": varFromBlock(theme, "spacing-detail-panel-inline"),
          "spacing-detail-panel-block": varFromBlock(theme, "spacing-detail-panel-block"),
        },
      },
    },
    tabs: {
      cssVars: {
        theme: {
          "spacing-tabs-list-height": varFromBlock(theme, "spacing-tabs-list-height"),
          "spacing-tabs-list-inset": varFromBlock(theme, "spacing-tabs-list-inset"),
          "spacing-tabs-trigger-inline": varFromBlock(theme, "spacing-tabs-trigger-inline"),
          "spacing-tabs-trigger-block": varFromBlock(theme, "spacing-tabs-trigger-block"),
          "spacing-tabs-content-gap": varFromBlock(theme, "spacing-tabs-content-gap"),
        },
      },
      css: expectedFocusRingCss(cssText),
    },
    card: {
      cssVars: {
        theme: {
          "spacing-card-stack": varFromBlock(theme, "spacing-card-stack"),
          "spacing-card-padding": varFromBlock(theme, "spacing-card-padding"),
        },
      },
    },
    "app-shell": {
      cssVars: {
        theme: {
          "spacing-app-shell-sidebar": varFromBlock(theme, "spacing-app-shell-sidebar"),
          "spacing-app-shell-padding": varFromBlock(theme, "spacing-app-shell-padding"),
          "spacing-app-shell-padding-md": varFromBlock(theme, "spacing-app-shell-padding-md"),
        },
      },
    },
    "wizard-steps": {
      cssVars: {
        theme: {
          "spacing-icon-sm": varFromBlock(theme, "spacing-icon-sm"),
          "spacing-wizard-steps-gap": varFromBlock(theme, "spacing-wizard-steps-gap"),
          "spacing-wizard-steps-row-gap": varFromBlock(theme, "spacing-wizard-steps-row-gap"),
          "spacing-wizard-step-gap": varFromBlock(theme, "spacing-wizard-step-gap"),
          "spacing-wizard-step-badge": varFromBlock(theme, "spacing-wizard-step-badge"),
          "spacing-wizard-step-connector-gap": varFromBlock(theme, "spacing-wizard-step-connector-gap"),
          "spacing-wizard-step-connector-thickness": varFromBlock(theme, "spacing-wizard-step-connector-thickness"),
          "spacing-wizard-step-connector": varFromBlock(theme, "spacing-wizard-step-connector"),
        },
      },
    },
    "icon-label": {
      cssVars: {
        theme: {
          "spacing-icon-control": varFromBlock(theme, "spacing-icon-control"),
        },
      },
    },
    "card-skeleton": {
      cssVars: {
        theme: {
          "spacing-card-padding": varFromBlock(theme, "spacing-card-padding"),
          "spacing-card-stack": varFromBlock(theme, "spacing-card-stack"),
          "spacing-card-section": varFromBlock(theme, "spacing-card-section"),
          "spacing-card-lines": varFromBlock(theme, "spacing-card-lines"),
        },
      },
    },
    theme: expectedCopyThemeItem(cssText),
    button: {
      cssVars: {
        theme: {
          "spacing-control-height": varFromBlock(theme, "spacing-control-height"),
          "spacing-control-height-sm": varFromBlock(theme, "spacing-control-height-sm"),
          "spacing-control-height-lg": varFromBlock(theme, "spacing-control-height-lg"),
          "spacing-button-inline": varFromBlock(theme, "spacing-button-inline"),
          "spacing-button-inline-sm": varFromBlock(theme, "spacing-button-inline-sm"),
          "spacing-button-inline-lg": varFromBlock(theme, "spacing-button-inline-lg"),
          "spacing-button-gap": varFromBlock(theme, "spacing-button-gap"),
          "ring-width-control": varFromBlock(root, "ring-width-control"),
          "ring-offset-width": varFromBlock(root, "ring-offset-width"),
        },
      },
      css: {
        ...expectedFocusRingControlCss(cssText),
        ...expectedButtonPressCss(cssText),
      },
    },
    dialog: {
      cssVars: {
        theme: {
          "spacing-dialog-center": varFromBlock(theme, "spacing-dialog-center"),
          "spacing-dialog-gap": varFromBlock(theme, "spacing-dialog-gap"),
          "spacing-dialog-padding": varFromBlock(theme, "spacing-dialog-padding"),
          "spacing-dialog-header-stack": varFromBlock(theme, "spacing-dialog-header-stack"),
          "spacing-dialog-footer-gap": varFromBlock(theme, "spacing-dialog-footer-gap"),
          "spacing-dialog-max-height": varFromBlock(theme, "spacing-dialog-max-height"),
          "spacing-dialog-header-end": varFromBlock(theme, "spacing-dialog-header-end"),
          "spacing-dialog-footer-safe": varFromBlock(theme, "spacing-dialog-footer-safe"),
          "spacing-overlay-touch-target": varFromBlock(theme, "spacing-overlay-touch-target"),
          "spacing-overlay-close-offset": varFromBlock(theme, "spacing-overlay-close-offset"),
        },
      },
      css: expectedDialogCenterCss(cssText),
    },
  };
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}}`;
  }
  return JSON.stringify(value);
}

/** @returns {string[]} */
export function checkRegistryThemeDrift(root) {
  const registryPath = join(root, "registry.json");
  const stylesPath = join(root, STYLES_REL);
  const registry = JSON.parse(readFileSync(registryPath, "utf8"));
  const cssText = readFileSync(stylesPath, "utf8");
  const expectedByBrick = expectedRegistryThemeFromStyles(cssText);
  const errors = [];

  for (const item of registry.items ?? []) {
    const expected = expectedByBrick[item.name];
    if (!expected) {
      if (item.cssVars || item.css) {
        errors.push(
          `${item.name}: registry theme tokens are not covered by theme-tokens.mjs (register expected cssVars/css).`,
        );
      }
      continue;
    }
    if (item.cssVars && stableJson(item.cssVars) !== stableJson(expected.cssVars)) {
      errors.push(
        `${item.name}: registry.json cssVars does not match ${STYLES_REL} (run expectedRegistryThemeFromStyles or update registry).`,
      );
    }
    if (item.css && stableJson(item.css) !== stableJson(expected.css)) {
      errors.push(`${item.name}: registry.json css does not match ${STYLES_REL} (@utility focus-ring).`);
    }
    if (expected.cssVars && !item.cssVars) {
      errors.push(`${item.name}: registry.json missing cssVars required by ${STYLES_REL}.`);
    }
    if (expected.css && !item.css) {
      errors.push(`${item.name}: registry.json missing css required by ${STYLES_REL}.`);
    }
  }

  return errors;
}
