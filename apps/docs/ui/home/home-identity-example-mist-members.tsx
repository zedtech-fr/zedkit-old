"use client";

import { useRef, useState } from "react";
import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@zedtech/zedkit-ui";
import { homeIdentityExamplesCopy } from "@/ui/home/home-identity-examples-copy";
import { HomeIdentityExampleMistMemberDrawer, type Member } from "@/ui/home/home-identity-example-mist-member-drawer";

const copy = homeIdentityExamplesCopy.mist;

/**
 * Members: the whole row opens that member in a drawer. The name is the real button (keyboard, screen reader);
 * its pseudo-element stretches over the row so a click anywhere on it does the same. The kit's press scale is
 * turned off here: a scaled button becomes the containing block of its pseudo-element and shrinks the target
 * to the name while the mouse is down.
 */
export function HomeIdentityExampleMistMembers() {
  const [members, setMembers] = useState<Member[]>(() => copy.rows.map((row) => ({ ...row })));
  const [openName, setOpenName] = useState<string>(copy.rows[0].member);
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement | null>(null);
  const current = members.find((item) => item.member === openName) ?? members[0]!;

  return (
    <>
      <Table aria-label={copy.tableAriaLabel}>
        <TableHeader>
          <TableRow>
            <TableHead>{copy.columns.member}</TableHead>
            <TableHead>{copy.columns.role}</TableHead>
            <TableHead>{copy.columns.status}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((row) => (
            <TableRow key={row.member} className="relative">
              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  aria-haspopup="dialog"
                  className="h-auto! min-h-0 justify-start p-0 font-normal after:absolute after:inset-0 hover:bg-transparent active:scale-none!"
                  onClick={(event) => {
                    opener.current = event.currentTarget;
                    setOpenName(row.member);
                    setOpen(true);
                  }}
                >
                  {row.member}
                </Button>
              </TableCell>
              <TableCell>{row.role}</TableCell>
              <TableCell>
                <Badge variant={row.tone}>{row.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <HomeIdentityExampleMistMemberDrawer
        member={current}
        open={open}
        onOpenChange={setOpen}
        onRestoreFocus={() => opener.current?.focus({ preventScroll: true })}
        onSaveRole={(role) =>
          setMembers((list) => list.map((item) => (item.member === current.member ? { ...item, role } : item)))
        }
      />
    </>
  );
}
