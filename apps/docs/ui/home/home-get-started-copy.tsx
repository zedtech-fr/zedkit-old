"use client";

import { HomeGetStartedAdoptionResult } from "@/ui/home/home-get-started-adoption-result";
import { HOME_SECTION_CONTENT_GAP } from "@/ui/home/home-rhythm";
import { Stack } from "@zedtech/zedkit-ui";

export function HomeGetStartedCopy({
  packageName,
  brick,
  source,
}: {
  packageName: string;
  brick: string;
  source: string;
}) {
  return (
    <Stack gap={HOME_SECTION_CONTENT_GAP} className="w-full min-w-0">
      <HomeGetStartedAdoptionResult packageName={packageName} brick={brick} source={source} />
    </Stack>
  );
}
