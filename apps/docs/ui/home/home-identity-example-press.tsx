"use client";

import { useId, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Heading,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  Textarea,
} from "@zedtech/zedkit-ui";
import { homeIdentityExamplesCopy } from "@/ui/home/home-identity-examples-copy";

const copy = homeIdentityExamplesCopy.press;

type StatusId = keyof typeof copy.statuses;
type Story = { id: string; headline: string; section: string; standfirst: string; status: StatusId };

const INITIAL: Story[] = copy.stories.map((story) => ({ ...story }));
const sectionLabel = (value: string) => copy.sections.find((item) => item.value === value)?.label ?? value;

/** The queue: one row per story, the picked one is pressed. */
function StoryQueue({ stories, selectedId, onSelect }: { stories: Story[]; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <Table aria-label={copy.queueAriaLabel}>
      <TableHeader>
        <TableRow>
          <TableHead>{copy.columns.story}</TableHead>
          <TableHead>{copy.columns.status}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stories.map((story) => (
          <TableRow key={story.id}>
            <TableCell>
              <Button
                type="button"
                variant="ghost"
                aria-pressed={story.id === selectedId}
                className="h-auto! min-h-11 w-full flex-col items-start gap-0 px-2 py-1 text-left font-normal whitespace-normal"
                onClick={() => onSelect(story.id)}
              >
                <span className="font-(family-name:--zk-font-display)">{story.headline}</span>
                <span className="text-xs text-muted-foreground">{sectionLabel(story.section)}</span>
              </Button>
            </TableCell>
            <TableCell>
              <Badge variant={copy.statuses[story.status].tone}>{copy.statuses[story.status].label}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Headline, section and standfirst, with the reading preview they produce. */
function StoryEditor({ story, onChange }: { story: Story; onChange: (patch: Partial<Story>) => void }) {
  const headlineId = useId();
  const sectionId = useId();
  const standfirstId = useId();
  return (
    <Stack gap={3} className="min-w-0">
      <Stack gap={1}>
        <Label htmlFor={headlineId}>{copy.headlineLabel}</Label>
        <Input id={headlineId} value={story.headline} onChange={(event) => onChange({ headline: event.target.value })} />
      </Stack>
      <Stack gap={1}>
        <Label htmlFor={sectionId}>{copy.sectionLabel}</Label>
        <Select value={story.section} onValueChange={(section) => onChange({ section })}>
          <SelectTrigger id={sectionId} aria-label={copy.sectionLabel}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {copy.sections.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Stack>
      <Stack gap={1}>
        <Label htmlFor={standfirstId}>{copy.standfirstLabel}</Label>
        <Textarea id={standfirstId} rows={3} value={story.standfirst} onChange={(event) => onChange({ standfirst: event.target.value })} />
      </Stack>
    </Stack>
  );
}

/** The story as a reader sees it: the display face and a capped measure are the evidence. */
function ReadingPreview({ story }: { story: Story }) {
  return (
    <article aria-label={copy.previewLabel} className="max-w-prose min-w-0 border-t border-border pt-4">
      <Text variant="muted" className="text-xs font-medium tracking-wide uppercase">
        {sectionLabel(story.section)}
      </Text>
      <Heading level={3} className="mt-1 font-(family-name:--zk-font-display) text-lg text-balance">
        {story.headline}
      </Heading>
      <Text variant="muted" className="mt-2 text-pretty">
        {story.standfirst}
      </Text>
    </article>
  );
}

export function HomeIdentityExamplePress() {
  const [stories, setStories] = useState<Story[]>(INITIAL);
  const [selectedId, setSelectedId] = useState(INITIAL[0]!.id);
  const [message, setMessage] = useState("");
  const story = stories.find((item) => item.id === selectedId) ?? stories[0]!;
  const change = (patch: Partial<Story>) =>
    setStories((list) => list.map((item) => (item.id === story.id ? { ...item, ...patch } : item)));
  const move = (status: StatusId, say: (headline: string) => string) => {
    change({ status });
    setMessage(say(story.headline));
  };

  return (
    <Stack gap={4} className="min-w-0">
      <Stack gap={1}>
        <Heading level={3} className="font-(family-name:--zk-font-display) text-lg text-balance">
          {copy.heading}
        </Heading>
        <Text variant="muted">{copy.description}</Text>
      </Stack>
      <Card className="min-w-0">
        <CardContent className="pt-4">
          <Stack gap={4} className="min-w-0">
            <StoryQueue stories={stories} selectedId={story.id} onSelect={(id) => { setSelectedId(id); setMessage(""); }} />
            <StoryEditor story={story} onChange={change} />
            <Stack direction="horizontal" gap={2} className="flex-wrap">
              <Button type="button" onClick={() => move("published", copy.published)}>
                {copy.publish}
              </Button>
              <Button type="button" variant="secondary" onClick={() => move("draft", copy.drafted)}>
                {copy.saveDraft}
              </Button>
            </Stack>
            <Text variant="muted" role="status" data-home-identity-status="">
              {message}
            </Text>
            <ReadingPreview story={story} />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
