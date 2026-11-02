"use client";

import Link from "next/link";
import { Button, SecretField, Stack, Text } from "@zedtech/zedkit-ui";
import { DocsActionLabel } from "@/components/docs-action-label";
import { HOME_CARD_CONTENT_GAP, HOME_METADATA_TEXT_CLASS, HOME_PERSUASION_TEXT_CLASS } from "@/ui/home/home-rhythm";
import { homeCopy } from "@/ui/home/i18n/home-copy";

export function HomeGetStartedAiBlock({ initCommand }: { initCommand: string }) {
  return (
    <Stack gap={HOME_CARD_CONTENT_GAP} id="ai-setup" className="scroll-mt-24">
      <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
        {homeCopy.getStarted.ai.leadPrefix}
        <Text as="span" className={`font-mono ${HOME_METADATA_TEXT_CLASS}`}>
          {homeCopy.getStarted.ai.setupAiSlash}
        </Text>
        {homeCopy.getStarted.ai.leadSuffix}
      </Text>
      <SecretField
        multiline
        value={initCommand}
        aria-label={homeCopy.getStarted.ai.initAriaLabel}
        copyLabel={homeCopy.getStarted.ai.initCopyLabel}
      />
      <SecretField
        multiline
        value={homeCopy.getStarted.ai.setupAiSlash}
        aria-label={homeCopy.getStarted.ai.setupAiAriaLabel}
        copyLabel={homeCopy.getStarted.ai.setupAiCopyLabel}
      />
      <Stack direction="horizontal" gap={2} className="flex-wrap" data-docs-ctas="">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/docs/set-up-your-coding-agents#what-gets-installed">
            <DocsActionLabel>{homeCopy.getStarted.ai.whatGetsInstalled}</DocsActionLabel>
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/docs/ai/set-up-ai-agent-instructions-skills-subagents-and-commands-in-a-repo">
            <DocsActionLabel>{homeCopy.getStarted.ai.aiSetupDocs}</DocsActionLabel>
          </Link>
        </Button>
      </Stack>
    </Stack>
  );
}
