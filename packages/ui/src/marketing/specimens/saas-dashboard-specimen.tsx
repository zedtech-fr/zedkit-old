"use client";

import { useId, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Heading,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ProgressBar,
  Stack,
  Text,
} from "../specimen-primitives.js";
import { specimenMessagesEn } from "./specimens-messages.js";

const isEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value.trim());

export type SaasDashboardSpecimenProps = {
  className?: string;
  messages?: typeof specimenMessagesEn.saasDashboard;
};

type SaasMessages = typeof specimenMessagesEn.saasDashboard;

function SaasOverviewCard({ messages }: { messages: SaasMessages }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <Heading level={3}>{messages.heading}</Heading>
        <Text variant="muted">{messages.description}</Text>
      </CardHeader>
      <CardContent>
        <Stack gap={4} className="min-w-0">
          <div className="grid min-w-0 grid-cols-2 gap-3">
            {messages.stats.map((stat) => (
              <div key={stat.label} className="min-w-0">
                <Text variant="muted">{stat.label}</Text>
                <Text className="text-2xl font-semibold tabular-nums">{stat.value}</Text>
              </div>
            ))}
          </div>
          <Stack gap={1} role="group" aria-label={messages.quotasAriaLabel}>
            <Stack direction="horizontal" gap={2} className="flex-wrap justify-between">
              <Text as="span" className="text-sm font-medium">
                {messages.quotaLabel}
              </Text>
              <Text as="span" variant="muted">
                {messages.quotaText(4200, 10000)}
              </Text>
            </Stack>
            <ProgressBar value={4200} max={10000} label={messages.quotaLabel} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function SaasInvitePopover({
  messages,
  onInvite,
}: {
  messages: SaasMessages;
  onInvite: (email: string) => void;
}) {
  const emailId = useId();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          {messages.invite}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 max-w-[calc(100vw-2rem)]">
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = email.trim();
            if (!isEmail(trimmed)) return;
            onInvite(trimmed);
            setEmail("");
            setOpen(false);
          }}
        >
          <Text className="font-medium">{messages.inviteTitle}</Text>
          <Stack gap={1}>
            <Label htmlFor={emailId}>{messages.emailLabel}</Label>
            <Input
              id={emailId}
              type="email"
              value={email}
              placeholder={messages.emailPlaceholder}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Stack>
          <Button type="submit" disabled={!isEmail(email)}>
            {messages.send}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function SaasTeamCard({
  messages,
  members,
  status,
  onInvite,
}: {
  messages: SaasMessages;
  members: { id: string; name: string; role: string }[];
  status: string;
  onInvite: (email: string) => void;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <Stack direction="horizontal" gap={2} className="flex-wrap items-center justify-between">
          <Heading level={4}>{messages.teamHeading}</Heading>
          <SaasInvitePopover messages={messages} onInvite={onInvite} />
        </Stack>
      </CardHeader>
      <CardContent>
        <ul aria-label={messages.teamAriaLabel} className="m-0 list-none p-0">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
              <Text as="span" className="min-w-0 truncate">
                {member.name}
              </Text>
              <Badge variant="secondary">{member.role}</Badge>
            </li>
          ))}
        </ul>
        <Text variant="muted" role="status" className="mt-3 min-h-6">
          {status}
        </Text>
      </CardContent>
    </Card>
  );
}

export function SaasDashboardSpecimen({ className, messages = specimenMessagesEn.saasDashboard }: SaasDashboardSpecimenProps) {
  const [members, setMembers] = useState([{ id: "1", name: "Alex Chen", role: "Admin" }]);
  const [status, setStatus] = useState("");

  return (
    <Stack gap={4} className={`min-w-0 ${className ?? ""}`} data-slot="saas-dashboard-specimen" data-specimen-domain="saas-dashboard">
      <SaasOverviewCard messages={messages} />
      <SaasTeamCard
        messages={messages}
        members={members}
        status={status}
        onInvite={(email) => {
          setMembers((list) => [...list, { id: `m-${list.length}`, name: email, role: messages.invitedRole }]);
          setStatus(messages.invitedMessage(email));
        }}
      />
    </Stack>
  );
}
