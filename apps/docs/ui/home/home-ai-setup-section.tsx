import Link from "next/link";
import { Button, Heading, SecretField, Section, Stack, StickyAside, Text } from "@zedtech/zedkit-ui";
import { DocsActionLabel } from "@/components/docs-action-label";
import { AI_SETUP_DOCS_PATH, AI_SETUP_KIT, AI_SETUP_MINI_PROMPT } from "@/lib/ai-setup-onboarding.generated";
import { HomeAiSetupTerminal } from "@/ui/home/home-ai-setup-terminal";
import {
  HOME_MARKETING_ROOT_PROPS,
  HOME_METADATA_TEXT_CLASS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SECTION_CONTENT_GAP,
  HOME_SECTION_REVEAL_PROPS,
} from "@/ui/home/home-rhythm";
import { homeAiSetupCopy } from "@/ui/home/i18n/home-ai-setup-copy";

const { prompt, whatYouGet } = homeAiSetupCopy;

/** Names from the kit manifest only: a renamed skill or subagent fails the build instead of lingering here. */
function kitNames(names: readonly string[], pool: readonly string[]): string {
  const missing = names.filter((name) => !pool.includes(name));
  if (missing.length > 0) throw new Error(`home AI setup names not in the kit preset: ${missing.join(", ")}`);
  return names.join(" · ");
}

const items = [
  { id: "review", names: kitNames(["review", "code-review", "ponytail-review", "persona-review"], AI_SETUP_KIT.skills) },
  { id: "done", names: kitNames(["definition-of-done", "tdd", "adversarial-tests"], AI_SETUP_KIT.skills) },
  { id: "roles", names: kitNames(["orchestrator", "explorer", "verifier"], AI_SETUP_KIT.agents) },
  { id: "repo", names: kitNames(["setup-ai", "domain-modeling", "rules-upkeep"], AI_SETUP_KIT.skills) },
] as const;

function HomeAiSetupMono({ children }: { children: string }) {
  return (
    <Text as="span" className="font-mono">
      {children}
    </Text>
  );
}

function HomeAiSetupWhatYouGet() {
  const { counts } = AI_SETUP_KIT;
  return (
    <Stack gap={4}>
      <Stack gap={1}>
        <Heading level={3} typeRole="heading">
          {whatYouGet.title}
        </Heading>
        <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
          {whatYouGet.summary(counts.skills, counts.agents, counts.commands)}
        </Text>
      </Stack>
      <ul className="m-0 grid list-none gap-6 p-0">
        {items.map((item) => (
          <li key={item.id} className="flex min-w-0 flex-col gap-1 border-l-2 border-border pl-4">
            <Heading level={4} typeRole="cardTitle">
              {whatYouGet.items[item.id].title}
            </Heading>
            <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
              {whatYouGet.items[item.id].body}
            </Text>
            <Text variant="muted" typeRole="caption" className={`font-mono wrap-anywhere ${HOME_METADATA_TEXT_CLASS}`}>
              {item.names}
            </Text>
          </li>
        ))}
      </ul>
      <Text variant="muted" typeRole="caption" className={HOME_METADATA_TEXT_CLASS}>
        {whatYouGet.providers}
      </Text>
    </Stack>
  );
}

/** Right after the hero: the one-prompt AI setup, what it installs, and the files it leaves in the repo. */
export function HomeAiSetupSection() {
  return (
    <Section
      bleed
      spacing="md"
      containerWidth="wide"
      id="ai-setup"
      title={homeAiSetupCopy.section.title}
      description={homeAiSetupCopy.section.description}
      snap="none"
      {...HOME_SECTION_REVEAL_PROPS}
      {...HOME_MARKETING_ROOT_PROPS}
    >
      <StickyAside side="right" ratio="2/5" gap="lg" className="pt-4" data-home-ai-setup="">
        <StickyAside.Main>
          <Stack gap={HOME_SECTION_CONTENT_GAP}>
            <Stack gap={3}>
              <SecretField
                multiline
                value={AI_SETUP_MINI_PROMPT}
                aria-label={prompt.ariaLabel}
                copyLabel={prompt.copyLabel}
              />
              <Text variant="muted" typeRole="caption" className={HOME_METADATA_TEXT_CLASS}>
                {prompt.hintBefore} <HomeAiSetupMono>{prompt.hintCommand}</HomeAiSetupMono>
                {prompt.hintMiddle} <HomeAiSetupMono>{prompt.hintSlash}</HomeAiSetupMono> {prompt.hintAfter}
              </Text>
              <Stack direction="horizontal" className="flex-wrap" data-docs-ctas="">
                <Button asChild variant="outline" className="w-fit">
                  <Link href={AI_SETUP_DOCS_PATH}>
                    <DocsActionLabel>{homeAiSetupCopy.cta.guide}</DocsActionLabel>
                  </Link>
                </Button>
              </Stack>
            </Stack>
            <HomeAiSetupWhatYouGet />
          </Stack>
        </StickyAside.Main>
        <StickyAside.Aside asChild>
          <HomeAiSetupTerminal />
        </StickyAside.Aside>
      </StickyAside>
    </Section>
  );
}
