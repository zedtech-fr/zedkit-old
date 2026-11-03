"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Heading,
  Input,
  Label,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  Textarea,
} from "../../index.js";
import { specimenMessagesEn } from "./specimens-messages.js";

type Story = {
  id: string;
  headline: string;
  standfirst: string;
  status: keyof typeof specimenMessagesEn.editorial.statuses;
};

export type EditorialSpecimenProps = {
  className?: string;
  messages?: typeof specimenMessagesEn.editorial;
};

export function EditorialSpecimen({ className, messages = specimenMessagesEn.editorial }: EditorialSpecimenProps) {
  const [stories, setStories] = useState<Story[]>(() => messages.seed.map((row) => ({ ...row })));
  const [selectedId, setSelectedId] = useState<string>(messages.seed[0]!.id);
  const [status, setStatus] = useState("");
  const story = stories.find((item) => item.id === selectedId) ?? stories[0]!;

  return (
    <Stack gap={4} className={`min-w-0 ${className ?? ""}`} data-slot="editorial-specimen" data-specimen-domain="editorial">
      <Stack gap={1}>
        <Heading level={3}>{messages.heading}</Heading>
        <Text variant="muted">{messages.description}</Text>
      </Stack>
      <Card className="min-w-0">
        <CardContent className="pt-4">
          <Stack gap={4} className="min-w-0">
            <Table aria-label={messages.queueAriaLabel}>
              <TableHeader>
                <TableRow>
                  <TableHead>{messages.columns.story}</TableHead>
                  <TableHead>{messages.columns.status}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stories.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        aria-pressed={row.id === story.id}
                        className="h-auto! min-h-11 w-full flex-col items-start gap-0 px-2 py-1 text-left font-normal whitespace-normal"
                        onClick={() => {
                          setSelectedId(row.id);
                          setStatus("");
                        }}
                      >
                        {row.headline}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Badge variant={messages.statuses[row.status].tone}>{messages.statuses[row.status].label}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Stack gap={1}>
              <Label htmlFor="zk-specimen-editorial-headline">{messages.headlineLabel}</Label>
              <Input
                id="zk-specimen-editorial-headline"
                value={story.headline}
                onChange={(event) =>
                  setStories((list) => list.map((item) => (item.id === story.id ? { ...item, headline: event.target.value } : item)))
                }
              />
            </Stack>
            <Stack gap={1}>
              <Label htmlFor="zk-specimen-editorial-standfirst">{messages.standfirstLabel}</Label>
              <Textarea
                id="zk-specimen-editorial-standfirst"
                rows={2}
                value={story.standfirst}
                onChange={(event) =>
                  setStories((list) => list.map((item) => (item.id === story.id ? { ...item, standfirst: event.target.value } : item)))
                }
              />
            </Stack>
            <Stack direction="horizontal" gap={2} className="flex-wrap">
              <Button
                type="button"
                onClick={() => {
                  setStories((list) => list.map((item) => (item.id === story.id ? { ...item, status: "published" } : item)));
                  setStatus(messages.published(story.headline));
                }}
              >
                {messages.publish}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setStories((list) => list.map((item) => (item.id === story.id ? { ...item, status: "draft" } : item)));
                  setStatus(messages.drafted(story.headline));
                }}
              >
                {messages.saveDraft}
              </Button>
            </Stack>
            <Text variant="muted" role="status" className="min-h-6">
              {status}
            </Text>
            <article aria-label={messages.previewLabel} className="max-w-prose min-w-0 border-t border-border pt-4">
              <Heading level={4}>{story.headline}</Heading>
              <Text variant="muted" className="mt-2 text-pretty">
                {story.standfirst}
              </Text>
            </article>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
