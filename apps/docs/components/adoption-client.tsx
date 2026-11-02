"use client";

import { useState, type ReactNode } from "react";
import { CodeBlock } from "fumadocs-ui/components/codeblock";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Stack } from "@zedtech/zedkit-ui";
import { componentPageCopy } from "@/components/i18n/component-page-copy";
import { packageManagers, type PackageManager } from "@/lib/package-manager-commands";
import { isPackageManager, usePackageManager } from "@/lib/use-package-manager";

const { adoption, copyMethods } = componentPageCopy;

/** Compact, flat select that lives in a code header: same mono face as the code it switches. */
const HEADER_SELECT_CLASS = "h-control-height-sm w-auto gap-2 bg-background px-3 font-mono text-control shadow-none";

/**
 * One terminal command with a package-manager select next to its copy button.
 * Every variant is highlighted on the server; the choice is shared across the page and remembered.
 */
export function PackageCommandBlock({
  title,
  variants,
}: {
  title: string;
  variants: Record<PackageManager, ReactNode>;
}) {
  const [pm, setPm] = usePackageManager();
  return (
    <CodeBlock
      title={title}
      viewportProps={{ "aria-label": title }}
      Actions={({ className, children }) => (
        <Stack direction="horizontal" gap={1} {...(className ? { className } : {})}>
          <Select
            value={pm}
            onValueChange={(value) => {
              if (isPackageManager(value)) setPm(value);
            }}
          >
            <SelectTrigger aria-label={adoption.packageManagerLabel} className={HEADER_SELECT_CLASS}>
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
          {children}
        </Stack>
      )}
    >
      {variants[pm]}
    </CodeBlock>
  );
}

type CopyMethod = (typeof copyMethods)[number]["value"];

/** "Copy" has two ways in; a select picks one and the matching steps show below it. */
export function CopyMethodPanels({ cli, manual }: { cli: ReactNode; manual: ReactNode }) {
  const [method, setMethod] = useState<CopyMethod>(copyMethods[0].value);
  const current = copyMethods.find((item) => item.value === method) ?? copyMethods[0];
  return (
    <Stack gap={4}>
      <Select
        value={method}
        onValueChange={(value) => {
          const next = copyMethods.find((item) => item.value === value);
          if (next) setMethod(next.value);
        }}
      >
        <SelectTrigger aria-label={adoption.copyMethodLabel} className="w-full bg-background shadow-none sm:w-72">
          <SelectValue>{current.label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {copyMethods.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {method === "cli" ? cli : manual}
    </Stack>
  );
}
