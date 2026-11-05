"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, FC } from "react";

type DocsAppLinkProps = ComponentProps<"a"> & { prefetch?: boolean };

/**
 * Fumadocs chrome uses this as its framework `Link`. On `/`, turn off App Router prefetch so
 * the hero tour agent lap does not record RSC requests after networkidle.
 */
export const DocsAppLink: FC<DocsAppLinkProps> = ({ prefetch, href, children, ...props }) => {
  const onHome = usePathname() === "/";
  const resolved = prefetch ?? !onHome;
  if (href == null || href === "") {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }
  return (
    <NextLink
      {...(props as Omit<ComponentProps<typeof NextLink>, "href">)}
      href={href}
      prefetch={resolved}
    >
      {children}
    </NextLink>
  );
};
