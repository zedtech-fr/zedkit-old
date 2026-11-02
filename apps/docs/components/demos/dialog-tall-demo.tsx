import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";
import { dialogCopy } from "@/components/demos/i18n/dialog-copy";

const EVENTS = dialogCopy.tall.events;

export function DialogTallDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">{dialogCopy.tall.open}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogCopy.tall.title}</DialogTitle>
          <DialogDescription>{dialogCopy.tall.description}</DialogDescription>
        </DialogHeader>
        <Stack gap={2} className="py-2">
          {EVENTS.map((line) => (
            <Text key={line} variant="muted">
              {line}
            </Text>
          ))}
          <Input aria-label={dialogCopy.tall.noteAriaLabel} placeholder={dialogCopy.tall.notePlaceholder} />
        </Stack>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">{dialogCopy.tall.done}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
