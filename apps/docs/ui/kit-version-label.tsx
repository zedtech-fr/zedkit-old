import Link from "next/link";
import { LivePulse, Stack, Text } from "@zedtech/zedkit-ui";

/** UI kit version from generated gallery metadata; hero links to releases, shell is caption-only. */
export function KitVersionLabel({
  version,
  releasesHref,
  tone = "hero",
}: {
  version: string;
  releasesHref: string;
  /** `shell` drops the pulse — one quiet caption beside the logo. */
  tone?: "hero" | "shell";
}) {
  const label = `v${version} (releases)`;
  return (
    <Stack direction="horizontal" gap={2} className="items-center">
      {tone === "hero" ? <LivePulse label="Latest" /> : null}
      {tone === "shell" ? (
        <Text as="span" variant="muted" data-kit-version="" className="font-mono text-xs tabular-nums">
          v{version}
        </Text>
      ) : (
        <Link href={releasesHref} target="_blank" rel="noreferrer" aria-label={label} className="inline-flex min-h-overlay-touch-target items-center px-1">
          <Text variant="muted" className="font-mono text-sm">
            v{version}
          </Text>
        </Link>
      )}
    </Stack>
  );
}
