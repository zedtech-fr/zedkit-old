"use client";

import { ScrollReset } from "@zedtech/zedkit-ui";
import { usePathname } from "next/navigation";

/** Land at the top of each new page (or its #anchor); back/forward keeps its position. */
export function RouteScrollReset() {
  return <ScrollReset routeKey={usePathname()} />;
}
