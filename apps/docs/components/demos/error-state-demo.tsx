import { ErrorState } from "@zedtech/zedkit-ui";
import { errorStateCopy } from "@/components/demos/i18n/error-state-copy";

export function ErrorStateDemo() {
  return (
    <ErrorState
      title={errorStateCopy.title}
      description={errorStateCopy.description}
    />
  );
}
