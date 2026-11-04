import { useId } from "react";
import type * as React from "react";
import { Check } from "lucide-react";

import { Container } from "../layout.js";
import { Heading, Text } from "../typography.js";
import { cn } from "../utils.js";
import { GlassSurface } from "./glass-surface.js";
import { SectionHeader } from "./section-header.js";

export interface PricingPlan {
  /** Stable key; falls back to the position. */
  id?: string | undefined;
  /** Plan name, rendered as a level-3 heading. */
  name: React.ReactNode;
  /** The price as shown, for example `€0` or `€29`. */
  price: React.ReactNode;
  /** What the price covers, for example `per month`. */
  period?: React.ReactNode;
  description?: React.ReactNode;
  /** What is included, one line each. */
  features: React.ReactNode[];
  /** The plan's call to action (button or link). */
  action?: React.ReactNode;
  /** Draw attention to this plan; pair it with a visible `badge`. */
  highlighted?: boolean | undefined;
  /** Short visible label such as "Most popular". Colour alone never marks the plan. */
  badge?: React.ReactNode;
}

export type PricingProps = Omit<React.ComponentProps<"section">, "title"> & {
  /** Section title, rendered as a level-2 heading. */
  title: React.ReactNode;
  description?: React.ReactNode;
  plans: PricingPlan[];
};

function columnsFor(count: number): string {
  if (count >= 3) return "sm:grid-cols-2 lg:grid-cols-3";
  if (count === 2) return "sm:grid-cols-2";
  return "";
}

function PlanCard({ plan }: { plan: PricingPlan }) {
  return (
    <GlassSurface
      as="li"
      tone={plan.highlighted ? "tinted" : "plain"}
      padding="lg"
      data-highlighted={plan.highlighted ? "true" : undefined}
      className={cn("flex flex-col gap-5", plan.highlighted && "border-primary ring-2 ring-primary")}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <Heading level={3} className="text-xl">
            {plan.name}
          </Heading>
          {plan.badge ? (
            <span
              data-slot="pricing-badge"
              className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
            >
              {plan.badge}
            </span>
          ) : null}
        </div>
        {plan.description ? <Text variant="muted">{plan.description}</Text> : null}
      </div>
      <p className="flex items-baseline gap-2">
        <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
        {plan.period ? <span className="text-sm text-muted-foreground">{plan.period}</span> : null}
      </p>
      <ul className="flex list-none flex-col gap-2 p-0">
        {plan.features.map((feature, featureIndex) => (
          <li key={featureIndex} className="flex gap-3">
            <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
            <span className="min-w-0">{feature}</span>
          </li>
        ))}
      </ul>
      {plan.action ? (
        <div data-slot="pricing-action" className="mt-auto flex flex-col pt-2 *:w-full">
          {plan.action}
        </div>
      ) : null}
    </GlassSurface>
  );
}

/** Plans side by side: name, price, what is included, one call to action each. */
function Pricing({ title, description, plans, className, ...props }: PricingProps) {
  const titleId = useId();
  return (
    <section
      data-slot="pricing"
      aria-labelledby={titleId}
      className={cn("py-section-md sm:py-section-lg", className)}
      {...props}
    >
      <Container width="default" className="flex flex-col gap-10">
        <SectionHeader titleId={titleId} title={title} description={description} />
        <ul className={cn("grid list-none items-stretch gap-4 p-0", columnsFor(plans.length))}>
          {plans.map((plan, index) => (
            <PlanCard key={plan.id ?? index} plan={plan} />
          ))}
        </ul>
      </Container>
    </section>
  );
}

export { Pricing };
