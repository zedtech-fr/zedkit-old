import type { Metadata } from "next";
import type { ReactNode } from "react";

import { rootLayoutCopy } from "@/app/i18n/root-layout-copy";
import { docsPageMetadata } from "@/lib/docs-metadata";
import { docsSite, homePage } from "@/lib/site";
import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import {
  DOCS_SITE_IDENTITY_OPT_IN_KEY,
  DOCS_SITE_IDENTITY_STORAGE_KEY,
} from "@/lib/site-identity-storage";
import { IdentityScript } from "@zedtech/zedkit-ui";
import { preload } from "react-dom";
import interLatin from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2";
import { Provider } from "./provider";
import "./globals.css";
import "./code-syntax.css";
import "./docs-typography.css";
import "./docs-shell-tokens.css";
import "./docs-signature.css";
import "./home-hero.css";
import "./catalog-shell.css";
import "./tide-fit.css";
import "./docs-tables.css";
import "./code-scroll.css";
import "./site-compact.css";
import "./docs-component-page.css";
import "./fonts";

const baseMetadata = docsPageMetadata("/", homePage);

export const metadata: Metadata = {
  ...baseMetadata,
  title: {
    default: homePage.title,
    template: rootLayoutCopy.titleTemplate(docsSite.name),
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  // The default identity sets Inter: fetch the Latin file with the page, so the
  // first paint already uses it and the text does not shift when it arrives.
  preload(typeof interLatin === "string" ? interLatin : interLatin.src, {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });
  return (
    <html lang="en" data-docs-shell suppressHydrationWarning>
      <head>
        <IdentityScript
          defaultIdentity={DEFAULT_IDENTITY}
          storageKey={DOCS_SITE_IDENTITY_STORAGE_KEY}
          optInStorageKey={DOCS_SITE_IDENTITY_OPT_IN_KEY}
        />
      </head>
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
