"use client";

import { Button, Stack, Text, cn, signatureMotionClass } from "@zedtech/zedkit-ui";

import { identityAssistantCopy as copy } from "@/components/i18n/identity-assistant-copy";
import { identityRefinementChips } from "@/lib/identity-refinement-chips";

/** Quick refinements after the first exchange; one tap sends a follow-up (dock and creator share this). */
export function IdentityRefinementChips({
  visible,
  disabled,
  onSelect,
}: {
  visible: boolean;
  disabled: boolean;
  onSelect: (prompt: string) => void;
}) {
  if (!visible) return null;
  return (
    <Stack gap={2} data-assistant-refine-chips="">
      <Text typeRole="label" className="text-foreground">
        {copy.refineChips.label}
      </Text>
      <Stack direction="horizontal" gap={2} role="group" aria-label={copy.refineChips.group} className="flex-wrap">
        {identityRefinementChips.map((chip) => (
          <Button
            key={chip.id}
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            data-assistant-refine-chip={chip.id}
            className={cn(
              "min-h-11 rounded-full border-foreground/20 bg-background px-3 text-foreground shadow-none hover:bg-muted/70 hover:text-foreground",
              signatureMotionClass.feedback,
            )}
            onClick={() => onSelect(chip.prompt)}
          >
            {chip.label}
          </Button>
        ))}
      </Stack>
      <Text variant="muted" typeRole="small">
        {copy.refineChips.hint}
      </Text>
    </Stack>
  );
}
