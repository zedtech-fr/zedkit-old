import { ImageResponse } from "next/og";
import { Logo } from "@zedtech/zedkit-ui";

import { openGraphCopy } from "@/app/i18n/opengraph-copy";

export const dynamic = "force-static";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#0f1a2b",
          color: "#f5f2ed",
          display: "flex",
          flexDirection: "column",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <Logo title="" style={{ height: 180, width: 240 }} />
        <div style={{ fontSize: 96, marginTop: 24, fontWeight: 600, letterSpacing: "-0.04em" }}>
          {openGraphCopy.name}
        </div>
        <div style={{ fontSize: 32, marginTop: 16, opacity: 0.75 }}>{openGraphCopy.tagline}</div>
      </div>
    ),
    { ...size },
  );
}
