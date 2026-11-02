"use client";

import { useState } from "react";
import { Archive, Copy, Pencil, RefreshCw, Share2, Trash2 } from "lucide-react";
import { Button, Heading, IconButton, Stack, Text } from "@zedtech/zedkit-ui";
import { iconButtonCopy } from "@/components/demos/i18n/icon-button-copy";

/** Project header toolbar: every button is icon-only, so each one needs its `label`. */
export function IconButtonDemo() {
  const [message, setMessage] = useState<string>(iconButtonCopy.demo.initialMessage);
  return (
    <Stack className="min-w-0 rounded-lg border border-border bg-background">
      <header className="flex min-w-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
        <Stack gap={1} className="min-w-0">
          <Heading level={2} className="text-xl text-balance">
            {iconButtonCopy.demo.title}
          </Heading>
          <Text variant="muted" className="text-xs">
            {iconButtonCopy.demo.subtitle}
          </Text>
        </Stack>
        <Stack direction="horizontal" gap={1} className="shrink-0">
          <IconButton label={iconButtonCopy.demo.refreshLabel} variant="ghost" onClick={() => setMessage(iconButtonCopy.demo.refreshed)}>
            <RefreshCw />
          </IconButton>
          <IconButton label={iconButtonCopy.demo.shareLabel} variant="ghost" onClick={() => setMessage(iconButtonCopy.demo.linkCopied)}>
            <Share2 />
          </IconButton>
          <IconButton label={iconButtonCopy.demo.archiveLabel} variant="outline" onClick={() => setMessage(iconButtonCopy.demo.archived)}>
            <Archive />
          </IconButton>
        </Stack>
      </header>
      <Stack gap={1} className="p-4">
        <Text role="status" variant="muted" className="text-sm">
          {message}
        </Text>
        <Text variant="muted" className="text-xs">
          {iconButtonCopy.demo.hint}
        </Text>
      </Stack>
    </Stack>
  );
}

const INITIAL_TASKS = [...iconButtonCopy.rows.tasks];

/** Row actions in a list: the task name is repeated in each label so rows stay distinguishable. */
export function IconButtonRowsDemo() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [duplicates, setDuplicates] = useState(0);
  return (
    <Stack gap={3} className="min-w-0">
      <ul aria-label={iconButtonCopy.rows.tasksAriaLabel} className="divide-y divide-border rounded-lg border border-border bg-background">
        {tasks.map((task) => (
          <li key={task.id} className="flex min-w-0 items-center justify-between gap-3 px-4 py-2">
            <Stack gap={1} className="min-w-0 flex-1">
              <Text as="span" className="font-medium">
                {task.title}
              </Text>
              <Text as="span" variant="muted" className="text-xs">
                {iconButtonCopy.rows.dueLine(task.owner, task.due)}
              </Text>
            </Stack>
            <Stack direction="horizontal" gap={1} className="shrink-0">
              <IconButton label={iconButtonCopy.rows.editLabel(task.title)} variant="ghost">
                <Pencil />
              </IconButton>
              <IconButton label={iconButtonCopy.rows.duplicateLabel(task.title)} variant="ghost" onClick={() => setDuplicates((n) => n + 1)}>
                <Copy />
              </IconButton>
              <IconButton
                label={iconButtonCopy.rows.deleteLabel(task.title)}
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setTasks((list) => list.filter((item) => item.id !== task.id))}
              >
                <Trash2 />
              </IconButton>
            </Stack>
          </li>
        ))}
        {tasks.length === 0 ? (
          <li className="px-4 py-3">
            <Text variant="muted">{iconButtonCopy.rows.noTasksLeft}</Text>
          </li>
        ) : null}
      </ul>
      <Stack direction="horizontal" gap={3} className="flex-wrap items-center">
        <Button variant="outline" size="sm" onClick={() => setTasks(INITIAL_TASKS)}>
          {iconButtonCopy.rows.restoreTasks}
        </Button>
        <Text role="status" variant="muted" className="text-xs">
          {duplicates === 0 ? iconButtonCopy.rows.noDuplicates : iconButtonCopy.rows.duplicatesRequested(duplicates)}
        </Text>
      </Stack>
    </Stack>
  );
}
