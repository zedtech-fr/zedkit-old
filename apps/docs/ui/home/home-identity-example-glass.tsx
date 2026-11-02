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
} from "@zedtech/zedkit-ui";
import { homeIdentityExamplesCopy } from "@/ui/home/home-identity-examples-copy";

const copy = homeIdentityExamplesCopy.glass;

type Member = { id: string; name: string; role: string };

const isEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value.trim());

function UsageCard() {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <Heading level={3} className="font-(family-name:--zk-font-display) text-lg text-balance">
          {copy.heading}
        </Heading>
        <Text variant="muted">{copy.description}</Text>
      </CardHeader>
      <CardContent>
        <Stack gap={4} className="min-w-0">
          <div className="grid min-w-0 grid-cols-2 gap-3">
            {copy.stats.map((stat) => (
              <div key={stat.label} className="min-w-0">
                <Text variant="muted">{stat.label}</Text>
                <Text className="font-(family-name:--zk-font-display) text-2xl font-semibold tabular-nums">{stat.value}</Text>
              </div>
            ))}
          </div>
          <Stack gap={3} role="group" aria-label={copy.quotasAriaLabel}>
            {copy.quotas.map((quota) => (
              <Stack key={quota.id} gap={1} className="min-w-0">
                <Stack direction="horizontal" gap={2} className="flex-wrap justify-between">
                  <Text as="span" className="text-sm font-medium">
                    {quota.label}
                  </Text>
                  <Text as="span" variant="muted">
                    {copy.quotaText(quota.used, quota.limit, quota.unit)}
                  </Text>
                </Stack>
                <ProgressBar value={quota.used} max={quota.limit} label={quota.label} />
              </Stack>
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

/** The popover floats over the team card, which floats over the halo: three surfaces, each readable. */
function InviteTeammate({ onInvite }: { onInvite: (email: string) => void }) {
  const emailId = useId();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline">
          {copy.invite}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 max-w-[calc(100vw-2rem)]">
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            onInvite(email.trim());
            setEmail("");
            setOpen(false);
          }}
        >
          <Text className="font-medium">{copy.inviteTitle}</Text>
          <Stack gap={1}>
            <Label htmlFor={emailId}>{copy.emailLabel}</Label>
            <Input id={emailId} type="email" value={email} placeholder={copy.emailPlaceholder} onChange={(event) => setEmail(event.target.value)} />
          </Stack>
          <Button type="submit" disabled={!isEmail(email)}>
            {copy.send}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function TeamCard({ members, message, onInvite }: { members: Member[]; message: string; onInvite: (email: string) => void }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <Stack direction="horizontal" gap={2} className="flex-wrap items-center justify-between">
          <Heading level={4} as="h3">
            {copy.teamHeading}
          </Heading>
          <InviteTeammate onInvite={onInvite} />
        </Stack>
      </CardHeader>
      <CardContent>
        <ul aria-label={copy.teamAriaLabel} className="m-0 list-none p-0">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
              <Text as="span" className="min-w-0 truncate">
                {member.name}
              </Text>
              <Badge variant={member.role === copy.invitedRole ? "outline" : "secondary"}>{member.role}</Badge>
            </li>
          ))}
        </ul>
        <Text variant="muted" role="status" data-home-identity-status="" className="mt-3 min-h-6">
          {message}
        </Text>
      </CardContent>
    </Card>
  );
}

export function HomeIdentityExampleGlass() {
  const [members, setMembers] = useState<Member[]>(() => copy.members.map((member) => ({ ...member })));
  const [message, setMessage] = useState("");
  return (
    <div className="relative min-w-0 overflow-hidden rounded-xl bg-linear-to-br from-primary/50 via-accent/40 to-background p-3 sm:p-4">
      <Stack gap={4} className="min-w-0">
        <UsageCard />
        <TeamCard
          members={members}
          message={message}
          onInvite={(email) => {
            setMembers((list) => [...list, { id: `invited-${list.length}`, name: email, role: copy.invitedRole }]);
            setMessage(copy.invitedMessage(email));
          }}
        />
      </Stack>
    </div>
  );
}
