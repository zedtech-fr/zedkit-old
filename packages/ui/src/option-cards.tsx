"use client";

import { useId } from "react";
import type * as React from "react";
import { Check } from "lucide-react";

import { cn } from "./utils.js";
import { useUiMessages } from "./ui-provider.js";

export interface OptionCardData {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
}

export interface OptionCardsProps {
  options: OptionCardData[];
  selected: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  className?: string;
  /** `true` (default): tick any number of cards. `false`: pick exactly one, as radio inputs. */
  multiple?: boolean;
}

export interface OptionCardProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  checked: boolean;
  onChange: () => void;
  className?: string;
  /** Native input kind: `checkbox` (default) or `radio` for a pick-one group. */
  type?: "checkbox" | "radio";
  /** Radio group name; pass the same value on every card of a group. */
  name?: string | undefined;
}

/**
 * One selectable card (checkbox or radio + visible check indicator + title + description).
 * Compose custom pickers with these; `OptionCards` covers the plain `options[]` case with
 * the same markup.
 */
export function OptionCard({
  title,
  description,
  checked,
  onChange,
  className,
  type = "checkbox",
  name,
}: OptionCardProps) {
  return (
    <label
      data-slot="option-card"
      className={cn(
        "flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors hover:border-muted-foreground/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
        className,
      )}
    >
      <input type={type} name={name} className="peer sr-only" checked={checked} onChange={onChange} />
      <span
        data-slot="option-card-indicator"
        aria-hidden="true"
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-content-center border border-input text-transparent transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground",
          type === "radio" ? "rounded-full" : "rounded-sm",
        )}
      >
        <Check className="size-3.5" strokeWidth={3} />
      </span>
      <span>
        <span className="block font-medium">{title}</span>
        {description ? <span className="block text-sm text-muted-foreground">{description}</span> : null}
      </span>
    </label>
  );
}

export function OptionCards({
  options,
  selected,
  onChange,
  label,
  className,
  multiple = true,
}: OptionCardsProps) {
  const messages = useUiMessages();
  const name = useId();
  function toggle(id: string): void {
    if (!multiple) {
      onChange([id]);
      return;
    }
    onChange(selected.includes(id) ? selected.filter((entry) => entry !== id) : [...selected, id]);
  }

  return (
    <div data-slot="option-cards" role={multiple ? "group" : "radiogroup"} aria-label={label ?? messages.options} className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {options.map((option) => (
        <OptionCard
          key={option.id}
          title={option.title}
          description={option.description}
          checked={selected.includes(option.id)}
          onChange={() => toggle(option.id)}
          type={multiple ? "checkbox" : "radio"}
          name={multiple ? undefined : name}
        />
      ))}
    </div>
  );
}
