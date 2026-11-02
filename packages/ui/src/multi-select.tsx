"use client";

import { ChevronDown } from "lucide-react";
import { Input } from "./input.js";
import { Popover, PopoverAnchor, PopoverContent } from "./popover.js";
import type { MultiSelectProps } from "./multi-select-types.js";
import { MultiSelectChips } from "./multi-select-chips.js";
import { MultiSelectMenu } from "./multi-select-menu.js";
import { useMultiSelectInputProps } from "./use-multi-select-input.js";
import { useMultiSelectLogic } from "./use-multi-select.js";
import { useUiMessages } from "./ui-provider.js";

export type { MultiSelectProps } from "./multi-select-types.js";

function MultiSelect(props: MultiSelectProps) {
  const messages = useUiMessages();
  const { combobox, filteredItems, selectedItems, selectedValues, selection } = useMultiSelectLogic(props);
  const { inputProps, openOnFocus } = useMultiSelectInputProps(combobox, selection);
  const emptyMessage = props.emptyMessage ?? messages.empty;
  const loading = props.loading ?? false;
  // Called every render, not only when the popover is open: downshift needs the call, and the ref attaches when the list mounts.
  const menuProps = combobox.getMenuProps({}, { suppressRefError: true });

  const removeItem = (item: (typeof selectedItems)[number]) => {
    if (props.disabled) return;
    selection.removeSelectedItem(item);
  };

  return (
    <Popover open={combobox.isOpen}>
      <PopoverAnchor asChild>
        <div className="w-full space-y-2" data-slot="multi-select">
          <MultiSelectChips
            items={selectedItems}
            onRemove={removeItem}
            selection={selection}
            disabled={props.disabled === true}
          />
          <div className="relative">
            <Input
              {...inputProps}
              className="pr-control-height"
              disabled={props.disabled}
              placeholder={props.placeholder ?? messages.search}
              id={props.id}
              aria-label={props["aria-label"]}
              aria-labelledby={props["aria-labelledby"]}
              onFocus={openOnFocus}
            />
            <button
              type="button"
              {...combobox.getToggleButtonProps({ disabled: Boolean(props.disabled) })}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
              aria-label={messages.options}
            >
              <ChevronDown className="size-4 opacity-50" />
            </button>
          </div>
        </div>
      </PopoverAnchor>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" onOpenAutoFocus={(event) => event.preventDefault()}>
        <MultiSelectMenu
          emptyMessage={emptyMessage}
          getItemProps={combobox.getItemProps}
          menuProps={menuProps}
          highlightedIndex={combobox.highlightedIndex}
          items={filteredItems}
          loading={loading}
          selectedValues={selectedValues}
        />
      </PopoverContent>
    </Popover>
  );
}

export { MultiSelect };
