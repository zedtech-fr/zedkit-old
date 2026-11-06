"use client";

import { useLayoutEffect } from "react";
import { useTheme } from "next-themes";

/** The colour people actually see behind the page (docs shell or kit background). */
function readThemeColor(): string {
  const body = getComputedStyle(document.body).backgroundColor;
  if (body && body !== "transparent" && body !== "rgba(0, 0, 0, 0)") return body;
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
  return bg ? `hsl(${bg})` : "#ffffff";
}

/**
 * Keeps every `<meta name="theme-color">` aligned with the page background:
 * the site theme can differ from the OS one, and an identity can change it.
 */
export function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();

  useLayoutEffect(() => {
    const root = document.documentElement;
    function sync() {
      const color = readThemeColor();
      const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
      if (metas.length === 0) {
        const meta = document.createElement("meta");
        meta.name = "theme-color";
        meta.content = color;
        document.head.appendChild(meta);
        return;
      }
      for (const meta of metas) meta.content = color;
    }
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-identity", "class"] });
    return () => observer.disconnect();
  }, [resolvedTheme]);

  return null;
}
