"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CodeBlock } from "fumadocs-ui/components/codeblock";
import { Check, Copy } from "lucide-react";
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Stack, Text } from "@zedtech/zedkit-ui";

import { adoptionCopy } from "@/components/i18n/adoption-copy";
import { packageManagers, type PackageManager } from "@/lib/package-manager-commands";
import { isPackageManager } from "@/lib/use-package-manager";

type CopyState = "idle" | "copied" | "failed";

/**
 * Copies the exact text of a block. The outcome is spoken (a polite status) as well as shown, because an icon
 * that swaps for a check is not announced.
 */
function CopyButton({ text, what }: { text: string; what: string }) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function settle(next: CopyState) {
    setState(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  }

  function copy() {
    const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
    if (!clipboard) return settle("failed");
    clipboard.writeText(text).then(
      () => settle("copied"),
      () => settle("failed"),
    );
  }

  return (
    <>
      {/* The code frame clips what it draws outside itself, so the focus ring is drawn inside the button. */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="focus-visible:-outline-offset-(--ring-width)"
        aria-label={adoptionCopy.copyLabel(what)}
        data-copy=""
        onClick={copy}
      >
        {state === "copied" ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      </Button>
      <Text as="span" role="status" className="sr-only">
        {state === "copied" ? adoptionCopy.copied : state === "failed" ? adoptionCopy.copyFailed : ""}
      </Text>
    </>
  );
}

/**
 * Compact, flat select that lives in a code header: same mono face as the code it switches. The frame clips
 * what is drawn outside it, so the focus ring is drawn inside the control.
 */
const HEADER_SELECT_CLASS =
  "h-control-height-sm w-auto gap-2 bg-background px-3 font-mono text-[length:var(--zk-input-font-size)] shadow-none focus-visible:-outline-offset-(--ring-width)";

function PackageManagerSelect({ pm, onPm }: { pm: PackageManager; onPm: (pm: PackageManager) => void }) {
  return (
    <Select
      value={pm}
      onValueChange={(value) => {
        if (isPackageManager(value)) onPm(value);
      }}
    >
      <SelectTrigger aria-label={adoptionCopy.packageManagerLabel} className={HEADER_SELECT_CLASS}>
        <SelectValue>{pm}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {packageManagers.map((name) => (
          <SelectItem key={name} value={name} className="font-mono">
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * A terminal command. The first command of a mode carries the one package-manager select; the others name
 * the manager in use, so the choice is visible without repeating the control.
 */
export function CommandBlock({
  commands,
  pm,
  onPm,
  picker,
  highlighted,
}: {
  commands: Record<PackageManager, string>;
  pm: PackageManager;
  onPm: (pm: PackageManager) => void;
  picker: boolean;
  highlighted: Record<PackageManager, ReactNode>;
}) {
  return (
    <CodeBlock
      data-adoption-frame=""
      title={adoptionCopy.terminalTitle}
      allowCopy={false}
      viewportProps={{ "aria-label": adoptionCopy.terminalTitle }}
      Actions={({ className }) => (
        <Stack direction="horizontal" gap={1} {...(className ? { className } : {})}>
          {picker ? (
            <PackageManagerSelect pm={pm} onPm={onPm} />
          ) : (
            <Text as="span" className="px-2 font-mono text-muted-foreground">
              {pm}
            </Text>
          )}
          <CopyButton text={commands[pm]} what={adoptionCopy.terminalTitle.toLowerCase()} />
        </Stack>
      )}
    >
      {highlighted[pm]}
    </CodeBlock>
  );
}

/** A file to create or edit: its path and what to do with it in the header, the code below. */
export function FileBlock({
  path,
  action,
  code,
  tall,
  highlighted,
}: {
  path: string;
  action: keyof typeof adoptionCopy.fileAction;
  code: string;
  tall: boolean;
  highlighted: ReactNode;
}) {
  return (
    <CodeBlock
      data-adoption-frame=""
      title={
        <Stack gap={1} className="min-w-0 gap-0 py-1">
          <Text as="span" className="truncate font-mono">
            {path}
          </Text>
          <Text as="span" className="text-xs text-muted-foreground">
            {adoptionCopy.fileAction[action]}
          </Text>
        </Stack>
      }
      allowCopy={false}
      viewportProps={{ "aria-label": path, ...(tall ? { className: "max-h-96" } : {}) }}
      Actions={({ className }) => (
        <Stack direction="horizontal" gap={1} {...(className ? { className } : {})}>
          <CopyButton text={code} what={path} />
        </Stack>
      )}
    >
      {highlighted}
    </CodeBlock>
  );
}

/** Code with no file of its own (an import line, a fragment). */
export function SnippetBlock({ title, code, highlighted }: { title: string; code: string; highlighted: ReactNode }) {
  return (
    <CodeBlock
      data-adoption-frame=""
      title={title}
      allowCopy={false}
      viewportProps={{ "aria-label": title }}
      Actions={({ className }) => (
        <Stack direction="horizontal" gap={1} {...(className ? { className } : {})}>
          <CopyButton text={code} what={title.toLowerCase()} />
        </Stack>
      )}
    >
      {highlighted}
    </CodeBlock>
  );
}
