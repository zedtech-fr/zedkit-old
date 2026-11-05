import Link from "next/link";
import type { ComponentProps } from "react";

/** Home marketing links opt out of App Router prefetch so the hero tour e2e does not record RSC fetches mid-lap. */
export function HomeLink(props: ComponentProps<typeof Link>) {
  return <Link prefetch={false} {...props} />;
}
