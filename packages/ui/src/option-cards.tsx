"use client";

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
}

export interface OptionCardProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  checked: boolean;
  onChange: () => void;
  className?: string;
}

/**
 * One selectable card (checkbox + visible check indicator + title + description). Compose
 * custom pickers with these; `OptionCards` covers the plain
 * `options[]` case with the same markup.
 */
export function OptionCard({ title, description, checked, onChange, className }: OptionCardProps) {
  return (
    <label
      data-slot="option-card"
      className={cn(
        "flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors hover:border-muted-foreground/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
        className,
      )}
    >
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} />
      <span
        data-slot="option-card-indicator"
        aria-hidden="true"
        className="mt-0.5 grid size-5 shrink-0 place-content-center rounded-sm border border-input text-transparent transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground"
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

export function OptionCards({ options, selected, onChange, label, className }: OptionCardsProps) {
  const messages = useUiMessages();
  function toggle(id: string): void {
    onChange(selected.includes(id) ? selected.filter((entry) => entry !== id) : [...selected, id]);
  }

  return (
    <div data-slot="option-cards" role="group" aria-label={label ?? messages.options} className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {options.map((option) => (
        <OptionCard
          key={option.id}
          title={option.title}
          description={option.description}
          checked={selected.includes(option.id)}
          onChange={() => toggle(option.id)}
        />
      ))}
    </div>
  );
}
