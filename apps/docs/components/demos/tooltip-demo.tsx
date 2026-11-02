import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@zedtech/zedkit-ui";
import { tooltipCopy } from "@/components/demos/i18n/tooltip-copy";

export function TooltipDemo() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button>{tooltipCopy.save}</Button>
      </TooltipTrigger>
      <TooltipContent>{tooltipCopy.hint}</TooltipContent>
    </Tooltip>
  );
}
