"use client";

import { Button, Stack, Toaster, toast } from "@zedtech/zedkit-ui";
import { toasterCopy } from "@/components/demos/i18n/toaster-copy";

export function ToasterDemo() {
  return (
    <>
      <Toaster />
      <Stack direction="horizontal" gap={3}>
        <Button variant="outline" onClick={() => toast(toasterCopy.saved)}>
          {toasterCopy.show}
        </Button>
        <Button variant="outline" onClick={() => toast.error(toasterCopy.failed)}>
          {toasterCopy.showError}
        </Button>
      </Stack>
    </>
  );
}
