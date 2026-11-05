"use client";

import { useId, useState } from "react";
import {
  Badge,
  Button,
  DetailPanel,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";
import { homeIdentityExamplesCopy } from "@/ui/home/home-identity-examples-copy";

const copy = homeIdentityExamplesCopy.mist;
const drawer = copy.drawer;

export type Member = {
  member: string;
  email: string;
  lastActive: string;
  role: string;
  status: string;
  tone: (typeof copy.rows)[number]["tone"];
};

/** The role is a draft until Save; `key` on the member resets it when another row is opened. */
function MemberPanel({ member, onSaveRole }: { member: Member; onSaveRole: (role: string) => void }) {
  const roleId = useId();
  const [role, setRole] = useState(member.role);
  const [resent, setResent] = useState(false);
  return (
    <>
      <DrawerBody>
        <Stack gap={4} className="min-w-0">
          <div aria-label={drawer.detailsAriaLabel} role="group">
            <DetailPanel
              items={[
                { label: drawer.email, value: member.email },
                { label: drawer.status, value: <Badge variant={member.tone}>{member.status}</Badge> },
                { label: drawer.lastActive, value: member.lastActive },
              ]}
            />
          </div>
          <Stack gap={1}>
            <Label htmlFor={roleId}>{drawer.roleLabel}</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id={roleId} aria-label={drawer.roleLabel}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {drawer.roles.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Stack>
          {member.status === "Invited" ? (
            <Stack gap={2}>
              <Button type="button" variant="outline" className="w-fit" disabled={resent} onClick={() => setResent(true)}>
                {drawer.resend}
              </Button>
              <Text variant="muted" role="status">
                {resent ? drawer.resent(member.email) : ""}
              </Text>
            </Stack>
          ) : null}
        </Stack>
      </DrawerBody>
      <DrawerFooter>
        <DrawerClose asChild>
          <Button type="button" onClick={() => onSaveRole(role)}>
            {drawer.save}
          </Button>
        </DrawerClose>
        <DrawerClose asChild>
          <Button type="button" variant="outline">
            {drawer.close}
          </Button>
        </DrawerClose>
      </DrawerFooter>
    </>
  );
}

/** A side panel on wide screens, a bottom sheet on phones (the kit's default for `direction="right"`). */
export function HomeIdentityExampleMistMemberDrawer({
  member,
  open,
  onOpenChange,
  onSaveRole,
  onRestoreFocus,
}: {
  member: Member;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveRole: (role: string) => void;
  /** The drawer has no trigger of its own, so the row's button takes focus back when it closes. */
  onRestoreFocus: () => void;
}) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      onAnimationEnd={(isOpen) => !isOpen && onRestoreFocus()}
      direction="right"
      noBodyStyles
    >
      <DrawerContent
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onRestoreFocus();
        }}
      >
        <DrawerHandle />
        <DrawerHeader>
          <DrawerTitle>{member.member}</DrawerTitle>
          <DrawerDescription>{drawer.description}</DrawerDescription>
        </DrawerHeader>
        <MemberPanel key={member.member} member={member} onSaveRole={onSaveRole} />
      </DrawerContent>
    </Drawer>
  );
}
