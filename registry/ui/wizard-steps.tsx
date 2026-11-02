"use client";

import * as React from "react";

import { CheckIcon } from "lucide-react";

import { formatMessage } from "@/components/ui/format-message";

import { cn } from "@/lib/utils";
import { useNarrowViewport } from "@/components/ui/use-narrow-viewport";
import { useUiMessages } from "@/components/ui/ui-provider";

export interface WizardStepsProps {
  steps: string[];
  /** 0-based index of the current step. */
  current: number;
  className?: string;
}

export type WizardStepState = "done" | "current" | "todo";

export interface WizardStepProps {
  step: string;
  /** 0-based position; shown as a number when not done. */
  index: number;
  state: WizardStepState;
  /** Trailing connector to the next step (omit on the last step). */
  showConnector?: boolean;
  className?: string;
}

/**
 * One step row (badge + label + optional connector). Compose custom
 * step lists with these inside your own `<ol>`; `WizardSteps` covers
 * the plain `steps[]` case.
 */
export function WizardStep({ step, index, state, showConnector = false, className }: WizardStepProps) {
  return (
    <li
      data-slot="wizard-step"
      aria-current={state === "current" ? "step" : undefined}
      className={cn("flex items-center gap-2 text-sm", className)}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-wizard-step-badge items-center justify-center rounded-full border text-xs font-medium",
          state === "done" && "border-primary bg-primary text-primary-foreground",
          state === "current" && "border-primary text-primary",
          state === "todo" && "text-muted-foreground",
        )}
      >
        {state === "done" ? <CheckIcon className="size-icon-sm" /> : index + 1}
      </span>
      <span className={cn(state === "current" ? "font-medium" : "text-muted-foreground")}>{step}</span>
      {showConnector ? (
        <span
          aria-hidden
          className="ml-wizard-step-connector-gap h-wizard-step-connector-thickness w-wizard-step-connector bg-border"
        />
      ) : null}
    </li>
  );
}

export type WizardProps = React.ComponentProps<"ol">;

/**
 * Step list container for composed `WizardStep` rows. `WizardSteps`
 * covers the plain `steps[]` case with the same markup.
 */
export function Wizard({ children, className, ...props }: WizardProps) {
  const messages = useUiMessages();
  return (
    <ol
      data-slot="wizard"
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", className)}
      aria-label={messages.progress}
      {...props}
    >
      {children}
    </ol>
  );
}

function stepState(index: number, current: number): WizardStepState {
  if (index < current) return "done";
  if (index === current) return "current";
  return "todo";
}

function clampStepIndex(current: number, stepCount: number): number {
  if (stepCount <= 0) return 0;
  return Math.min(Math.max(current, 0), stepCount - 1);
}

export function WizardSteps({ steps, current, className }: WizardStepsProps) {
  const messages = useUiMessages();
  const isMobile = useNarrowViewport(true);
  const active = clampStepIndex(current, steps.length);
  const title = steps[active] ?? "";

  return (
    <div data-slot="wizard-steps" className={cn("min-w-0 space-y-3", className)}>
      {isMobile ? (
        <div className="space-y-2">
          <p className="truncate text-sm text-muted-foreground">
            {formatMessage(messages.wizardStepOf, {
              step: active + 1,
              stepCount: steps.length,
              title,
            })}
          </p>
          <div
            role="progressbar"
            aria-label={messages.progress}
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-valuenow={active + 1}
            className="flex w-full gap-progress-bar-gap"
          >
            {steps.map((step, index) => (
              <span
                key={step}
                aria-hidden
                className={cn(
                  "h-progress-bar-height flex-1 rounded-full motion-safe:transition-colors",
                  index <= active ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>
        </div>
      ) : (
        <Wizard>
          {steps.map((step, index) => (
            <WizardStep
              key={step}
              step={step}
              index={index}
              state={stepState(index, current)}
              showConnector={index < steps.length - 1}
            />
          ))}
        </Wizard>
      )}
    </div>
  );
}
