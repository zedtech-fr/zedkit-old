import { Button, ErrorState } from "@zedtech/zedkit-ui";
import { errorStateCopy } from "@/components/demos/i18n/error-state-copy";

export function ErrorStateRetryDemo() {
  return (
    <ErrorState
      title={errorStateCopy.title}
      description={errorStateCopy.description}
      actions={<Button variant="outline">{errorStateCopy.tryAgain}</Button>}
    />
  );
}
