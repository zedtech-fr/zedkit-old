import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@zedtech/zedkit-ui";
import { dropdownMenuCopy } from "@/components/demos/i18n/dropdown-menu-copy";

export function DropdownMenuDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{dropdownMenuCopy.actions}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>{dropdownMenuCopy.duplicateRow}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>{dropdownMenuCopy.archiveRow}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
