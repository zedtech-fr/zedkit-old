import { HomeLink } from "@/ui/home/home-link";
import { Animate, Button, Heading, SecretField, Section, Stack, StickyAside, Text } from "@zedtech/zedkit-ui";
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

const KIT_POOL = [...AI_SETUP_KIT.skills, ...AI_SETUP_KIT.agents];
const items = [
  { id: "orchestration", names: kitNames(["orchestrator", "orchestrate", "parallel-work"], KIT_POOL) },
  { id: "roles", names: kitNames(["explorer", "verifier", "ui-designer", "copywriter"], KIT_POOL) },
  { id: "rules", names: kitNames(["setup-ai", "domain-modeling", "persona-review"], KIT_POOL) },
  { id: "skills", names: kitNames(["writing-for-agents", "rules-upkeep", "retro"], KIT_POOL) },
  { id: "checks", names: kitNames(["review", "definition-of-done", "tdd", "adversarial-tests"], KIT_POOL) },
] as const;

function HomeAiSetupMono({ children }: { children: string }) {
  return (
    <Text as="span" className="font-mono">
      {children}
    </Text>
  );
}

function HomeAiSetupWhatYouGet() {
  return (
    <Stack gap={4}>
      <Stack gap={1}>
        <Heading level={3} typeRole="heading">
          {whatYouGet.title}
        </Heading>
        <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
          {whatYouGet.summary}
        </Text>
      </Stack>
      <ul className="m-0 grid list-none gap-6 p-0" data-animate="fade-up" data-animate-stagger="">
        {items.map((item) => (
          <li key={item.id} className="flex min-w-0 flex-col gap-1 border-l-2 border-border pl-4">
            <Heading level={4} typeRole="cardTitle">
              {whatYouGet.items[item.id].title}
            </Heading>
            <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
              {whatYouGet.items[item.id].body}
            </Text>
            <Text variant="muted" typeRole="caption" className={`font-mono wrap-anywhere max-sm:hidden ${HOME_METADATA_TEXT_CLASS}`}>
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
      <Stack gap={HOME_SECTION_CONTENT_GAP} className="pt-4">
        <Stack gap={3} className="max-w-3xl">
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
              <HomeLink href={AI_SETUP_DOCS_PATH}>
                <DocsActionLabel>{homeAiSetupCopy.cta.guide}</DocsActionLabel>
              </HomeLink>
            </Button>
          </Stack>
        </Stack>
        {/* The benefits are the shorter column, so they are the aside and stay in view while the file tree scrolls. */}
        <StickyAside
          side="left"
          mobile="before"
          gap="lg"
          className="[--zk-sticky-cols:minmax(0,1fr)_minmax(0,30rem)]"
          data-home-ai-setup=""
        >
          <StickyAside.Main>
            <Animate on={{ appear: "fade-in" }} delay={120}>
              <HomeAiSetupTerminal />
            </Animate>
          </StickyAside.Main>
          <StickyAside.Aside>
            <HomeAiSetupWhatYouGet />
          </StickyAside.Aside>
        </StickyAside>
      </Stack>
    </Section>
  );
}
