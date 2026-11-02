import { EmptyState } from "@zedtech/zedkit-ui";
import { emptyStateCopy } from "@/components/demos/i18n/empty-state-copy";

export function EmptyStateDemo() {
  return <EmptyState title={emptyStateCopy.title} description={emptyStateCopy.description} />;
}
