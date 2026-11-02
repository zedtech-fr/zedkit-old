import Link from "next/link";
import { LivePulse, Stack, Text } from "@zedtech/zedkit-ui";
import { SHELL_VERSION_MONO_CLASS } from "@/lib/shell-nav-classes";

/** UI kit version from generated gallery metadata; links to the dated releases list. */
export function KitVersionLabel({
  version,
  releasesHref,
  tone = "hero",
}: {
  version: string;
  releasesHref: string;
  /** `shell` drops the pulse — one quiet badge beside the logo. */
  tone?: "hero" | "shell";
}) {
  const label = `v${version} (releases)`;
  return (
    <Stack direction="horizontal" gap={2} className="items-center">
      {tone === "hero" ? <LivePulse label="Latest" /> : null}
      <Link href={releasesHref} target="_blank" rel="noreferrer" aria-label={label} className="inline-flex min-h-overlay-touch-target items-center px-1">
        <Text
          variant="muted"
          className={tone === "shell" ? SHELL_VERSION_MONO_CLASS : "font-mono text-sm"}
        >
          v{version}
        </Text>
      </Link>
    </Stack>
  );
}
