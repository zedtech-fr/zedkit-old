import { Button, EmptyState } from "@zedtech/zedkit-ui";
import { emptyStateCopy } from "@/components/demos/i18n/empty-state-copy";

export function EmptyStateActionsDemo() {
  return (
    <EmptyState
      title={emptyStateCopy.title}
      description={emptyStateCopy.description}
      actions={<Button>{emptyStateCopy.newInvoice}</Button>}
    />
  );
}
