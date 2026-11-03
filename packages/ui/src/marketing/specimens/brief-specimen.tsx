"use client";

import type { SpecimenDomain } from "./specimen-domain.js";
import { selectSpecimenDomain } from "./specimen-domain.js";
import { CommerceSpecimen } from "./commerce-specimen.js";
import { EditorialSpecimen } from "./editorial-specimen.js";
import { SaasDashboardSpecimen } from "./saas-dashboard-specimen.js";
import { ServiceBookingSpecimen } from "./service-booking-specimen.js";

export type BriefSpecimenProps = {
  /** Product or brand brief; keywords pick the domain composition. */
  brief: string;
  /** Force a domain instead of keyword routing. */
  domain?: SpecimenDomain;
  className?: string;
};

/** Renders one of four domain specimens inside the active identity scope. */
export function BriefSpecimen({ brief, domain, className }: BriefSpecimenProps) {
  const resolved = domain ?? selectSpecimenDomain(brief);
  const shell = className ? { className } : {};
  let inner;
  switch (resolved) {
    case "commerce":
      inner = <CommerceSpecimen {...shell} />;
      break;
    case "editorial":
      inner = <EditorialSpecimen {...shell} />;
      break;
    case "service-booking":
      inner = <ServiceBookingSpecimen {...shell} />;
      break;
    case "saas-dashboard":
    default:
      inner = <SaasDashboardSpecimen {...shell} />;
  }
  return (
    <div data-slot="brief-specimen" className="min-w-0">
      {inner}
    </div>
  );
}
