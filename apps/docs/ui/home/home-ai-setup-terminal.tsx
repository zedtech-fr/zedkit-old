import { Stack, Surface, Text } from "@zedtech/zedkit-ui";
import { AI_SETUP_KIT, type AiSetupTreeRow } from "@/lib/ai-setup-onboarding.generated";
import { homeAiSetupCopy } from "@/ui/home/i18n/home-ai-setup-copy";

const { terminal } = homeAiSetupCopy;

function Prompt({ children }: { children: string }) {
  return (
    <>
      <span aria-hidden="true" className="text-muted-foreground select-none">
        ${" "}
      </span>
      {children}
    </>
  );
}

function TreeRow({ row }: { row: AiSetupTreeRow }) {
  return (
    <>
      <span className={row.kind === "dir" ? "text-foreground" : "text-muted-foreground"}>{row.text}</span>
      {row.note ? <span className="text-muted-foreground">{`  # ${row.note}`}</span> : null}
      {"\n"}
    </>
  );
}

/** The files `zedkit-ai setup` copies and `/setup-ai` adds, as a terminal transcript. Rows come from the kit manifest. */
export function HomeAiSetupTerminal({ className }: { className?: string | undefined }) {
  return (
    <Surface
      variant="solid"
      elevation={1}
      radius="xl"
      className={`min-w-0 overflow-hidden ${className ?? ""}`}
      data-home-ai-terminal=""
    >
      <Stack direction="horizontal" gap={2} className="items-center border-b border-border px-4 py-2">
        <Text as="span" typeRole="label" className="text-muted-foreground">
          {terminal.title}
        </Text>
      </Stack>
      {/* A named, focusable region so the clipped rows stay reachable with the keyboard on a phone. */}
      <pre
        role="region"
        aria-label={terminal.regionLabel}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable region must take focus
        tabIndex={0}
        className="m-0 max-h-72 overflow-auto p-4 font-mono text-zk-type-small whitespace-pre focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring lg:max-h-none"
      >
        <code>
          <Prompt>{terminal.installCommand}</Prompt>
          {"\n"}
          {AI_SETUP_KIT.installed.map((row) => (
            <TreeRow key={row.text} row={row} />
          ))}
          {"\n"}
          <span className="text-muted-foreground"># {terminal.writtenComment}</span>
          {"\n"}
          {AI_SETUP_KIT.written.map((file) => (
            <TreeRow key={file.path} row={{ text: `+ ${file.path}`, kind: "file", ...("note" in file ? { note: file.note } : {}) }} />
          ))}
          {"\n"}
          <Prompt>{terminal.validateCommand}</Prompt>
          {"\n"}
          {terminal.validateResult}
        </code>
      </pre>
    </Surface>
  );
}
