import {
  Badge,
  Button,
  DetailPanel,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";
import { dialogCopy } from "@/components/demos/i18n/dialog-copy";

export function DialogDemo() {
  return (
    <Stack gap={3} className="w-full max-w-md">
      <Text variant="muted" className="text-sm">
        {dialogCopy.demo.triggerContext}
      </Text>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">{dialogCopy.demo.open}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogCopy.demo.title}</DialogTitle>
            <DialogDescription>{dialogCopy.demo.description}</DialogDescription>
          </DialogHeader>
          <DetailPanel
            items={dialogCopy.demo.items.map((item) =>
              "badge" in item
                ? { label: item.label, value: <Badge variant={item.badge}>{item.value}</Badge> }
                : { label: item.label, value: item.value },
            )}
          />
          <DialogFooter>
            <Button variant="outline">{dialogCopy.demo.downloadInvoice}</Button>
            <Button>{dialogCopy.demo.markShipped}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
