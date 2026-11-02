import { Button, Card, CardDescription, CardHeader, CardTitle, Stack } from "@zedtech/zedkit-ui";
import { motionCopy } from "@/components/demos/i18n/motion-copy";

export function MotionHoverDemo() {
  return (
    <Stack gap={3} className="min-w-0">
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle>{motionCopy.hover.title}</CardTitle>
          <CardDescription>{motionCopy.hover.description}</CardDescription>
        </CardHeader>
      </Card>
      <Stack direction="horizontal">
        <Button className="hover-press">{motionCopy.hover.press}</Button>
      </Stack>
    </Stack>
  );
}
