"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardSkeleton, CardTitle, Stack } from "@zedtech/zedkit-ui";
import { cardCopy } from "@/components/demos/i18n/card-copy";

export function CardSkeletonStandaloneDemo() {
  const [loading, setLoading] = useState(true);
  return (
    <Stack gap={3} className="min-w-0">
      {loading ? (
        <CardSkeleton label={cardCopy.skeleton.loadingLabel} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{cardCopy.skeleton.title}</CardTitle>
            <CardDescription>{cardCopy.skeleton.description}</CardDescription>
          </CardHeader>
          <CardContent>{cardCopy.skeleton.content}</CardContent>
        </Card>
      )}
      <Stack direction="horizontal">
        <Button variant="outline" onClick={() => setLoading(!loading)}>
          {loading ? cardCopy.skeleton.showReport : cardCopy.skeleton.showSkeleton}
        </Button>
      </Stack>
    </Stack>
  );
}
