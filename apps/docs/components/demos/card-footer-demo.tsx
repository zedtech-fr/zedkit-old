"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";
import { cardCopy } from "@/components/demos/i18n/card-copy";

type State = "draft" | "saved" | "published";

/** A card whose footer holds the actions: publish now, or keep working. */
export function CardFooterDemo() {
  const [state, setState] = useState<State>("draft");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{cardCopy.footer.title}</CardTitle>
        <CardDescription>{cardCopy.footer.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Stack gap={2}>
          <Badge variant={state === "published" ? "default" : "secondary"} className="w-fit" role="status">
            {cardCopy.footer.status[state]}
          </Badge>
          <Text>{cardCopy.footer.body}</Text>
        </Stack>
      </CardContent>
      <CardFooter>
        <Stack direction="horizontal" gap={2}>
          <Button disabled={state === "published"} onClick={() => setState("published")}>
            {cardCopy.footer.publish}
          </Button>
          <Button variant="outline" disabled={state === "published"} onClick={() => setState("saved")}>
            {cardCopy.footer.saveDraft}
          </Button>
        </Stack>
      </CardFooter>
    </Card>
  );
}
