// Marketing sections: presentational building blocks for public pages.
// Separate entry (`@zedtech/zedkit-ui/marketing`) so apps that only need
// the console kit never pull them in. Strings are props; chrome labels
// come from `ZedkitUiProvider`.
export {
  BriefSpecimen,
  type BriefSpecimenProps,
} from "./specimens/brief-specimen.js";
export { CommerceSpecimen, type CommerceSpecimenProps } from "./specimens/commerce-specimen.js";
export { EditorialSpecimen, type EditorialSpecimenProps } from "./specimens/editorial-specimen.js";
export { SaasDashboardSpecimen, type SaasDashboardSpecimenProps } from "./specimens/saas-dashboard-specimen.js";
export { ServiceBookingSpecimen, type ServiceBookingSpecimenProps } from "./specimens/service-booking-specimen.js";
export {
  DEFAULT_DOMAIN,
  DOMAIN_KEYWORDS,
  selectSpecimenDomain,
  type SpecimenDomain,
} from "./specimens/specimen-domain.js";
export { specimenMessagesEn, type SpecimenMessages } from "./specimens/specimens-messages.js";
export { CtaBand, type CtaBandProps } from "./cta-band.js";
export { Faq, type FaqItem, type FaqProps } from "./faq.js";
export { FeatureGrid, type FeatureGridProps, type FeatureItem } from "./feature-grid.js";
export { GlassSurface, glassSurfaceVariants, type GlassSurfaceProps } from "./glass-surface.js";
export { Hero, type HeroProps } from "./hero.js";
export { HowItWorks, type HowItWorksProps, type HowItWorksStep } from "./how-it-works.js";
export { LogoBand, type LogoBandItem, type LogoBandProps } from "./logo-band.js";
export { LocaleSwitch, type LocaleOption, type LocaleSwitchProps } from "./locale-switch.js";
export {
  MarketingFooter,
  type MarketingFooterColumn,
  type MarketingFooterProps,
} from "./marketing-footer.js";
export { MarketingHeader, type MarketingHeaderProps } from "./marketing-header.js";
export { MediaSection, type MediaSectionProps } from "./media-section.js";
export { Pricing, type PricingPlan, type PricingProps } from "./pricing.js";
export { Testimonials, type Testimonial, type TestimonialsProps } from "./testimonials.js";
