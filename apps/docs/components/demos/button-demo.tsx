"use client";

import { Plus } from "lucide-react";
import { Button, Stack, Text, Toaster, toast } from "@zedtech/zedkit-ui";
import { buttonCopy } from "@/components/demos/i18n/button-copy";

export function ButtonDemo() {
  return (
    <>
      <Toaster />
      <Stack id="button-demo" gap={4}>
        <Text variant="muted" className="text-xs">
          {buttonCopy.hint}
        </Text>
        <Stack direction="horizontal" gap={2} className="flex-wrap items-center">
          <Button onClick={() => toast(buttonCopy.created)}>{buttonCopy.createApp}</Button>
          <Button variant="secondary" onClick={() => toast(buttonCopy.cancelled)}>
            {buttonCopy.cancel}
          </Button>
          <Button variant="outline" onClick={() => toast(buttonCopy.openedDetails)}>
            {buttonCopy.details}
          </Button>
          <Button variant="destructive" onClick={() => toast(buttonCopy.deleted)}>
            {buttonCopy.delete}
          </Button>
          <Button asChild variant="ghost">
            <a href="#button-demo" className="text-foreground">
              {buttonCopy.docsLink}
            </a>
          </Button>
        </Stack>
        <Stack direction="horizontal" gap={2} className="flex-wrap items-center">
          <Button size="sm" onClick={() => toast(buttonCopy.created)}>
            {buttonCopy.small}
          </Button>
          <Button onClick={() => toast(buttonCopy.created)}>{buttonCopy.default}</Button>
          <Button size="lg" onClick={() => toast(buttonCopy.created)}>
            {buttonCopy.large}
          </Button>
          <Button size="icon" aria-label={buttonCopy.addItemAriaLabel} onClick={() => toast(buttonCopy.added)}>
            <Plus />
          </Button>
        </Stack>
        <Stack direction="horizontal" gap={2} className="flex-wrap items-center">
          <Button disabled>{buttonCopy.disabled}</Button>
          <Button disabled>{buttonCopy.saving}</Button>
        </Stack>
      </Stack>
    </>
  );
}
