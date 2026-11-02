import { loader } from "fumadocs-core/source";
import { statusBadgesPlugin } from "fumadocs-core/source/plugins/status-badges";
import { MaturityBadge } from "@/components/maturity-badge";
import { docs } from "@/.source/server";

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  plugins: [
    statusBadgesPlugin({
      // Sidebar: alpha only (stable has no badge; beta is page + catalog only).
      renderBadge: (status) =>
        status.toLowerCase() === "alpha" ? <MaturityBadge status={status} /> : null,
    }),
  ],
});
