"use client";

import { useState } from "react";
import { Button, Stack, Text } from "@zedtech/zedkit-ui";
import { defineFlagRegistry, useFlag, writeFlagOverride, ZedkitFlagsProvider } from "@zedtech/zedkit-flags/react";
import { flagsCopy } from "@/components/demos/i18n/flags-copy";

const DEMO_REGISTRY = defineFlagRegistry({ docsPreview: false });
const DEMO_OVERRIDE_KEY = "docsPreview";

function FlagsDemoInner() {
  const enabled = useFlag(DEMO_OVERRIDE_KEY, false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  return (
    <Stack gap={3}>
      <Text>{enabled ? flagsCopy.on : flagsCopy.off}</Text>
      <Stack direction="horizontal" gap={2} className="flex-wrap">
        <Button
          type="button"
          onClick={() => {
            writeFlagOverride(localStorage, DEMO_OVERRIDE_KEY, true);
            setLastAction(flagsCopy.forcedOn);
          }}
        >
          {flagsCopy.forceOn}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            writeFlagOverride(localStorage, DEMO_OVERRIDE_KEY, false);
            setLastAction(flagsCopy.forcedOff);
          }}
        >
          {flagsCopy.forceOff}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            writeFlagOverride(localStorage, DEMO_OVERRIDE_KEY, null);
            setLastAction(flagsCopy.clearedOverride);
          }}
        >
          {flagsCopy.clearOverride}
        </Button>
      </Stack>
      {lastAction ? <Text className="text-sm text-muted-foreground">{lastAction}</Text> : null}
    </Stack>
  );
}

export function FlagsDemo() {
  return (
    <ZedkitFlagsProvider registry={DEMO_REGISTRY}>
      <FlagsDemoInner />
    </ZedkitFlagsProvider>
  );
}
