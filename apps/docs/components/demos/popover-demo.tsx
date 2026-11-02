import { Button, Heading, Popover, PopoverContent, PopoverTrigger, Stack, Text } from "@zedtech/zedkit-ui";
import { popoverCopy } from "@/components/demos/i18n/popover-copy";

export function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">{popoverCopy.trigger}</Button>
      </PopoverTrigger>
      <PopoverContent aria-label={popoverCopy.label}>
        <Stack gap={2}>
          <Heading level={3}>{popoverCopy.title}</Heading>
          <Text>{popoverCopy.status}</Text>
        </Stack>
      </PopoverContent>
    </Popover>
  );
}
