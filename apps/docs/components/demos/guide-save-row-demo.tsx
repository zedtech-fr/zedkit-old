import { Button } from "@zedtech/zedkit-ui";
import { guideSaveRowCopy } from "@/components/demos/i18n/guide-save-row-copy";

export function GuideSaveRowDemo() {
  return (
    <>
      <Button>{guideSaveRowCopy.save}</Button>
      <Button variant="destructive" size="sm">{guideSaveRowCopy.delete}</Button>
    </>
  );
}
