import { Button, Heading, Stack, Text } from "@zedtech/zedkit-ui";
import {
  CtaBand,
  Faq,
  FeatureGrid,
  GlassSurface,
  Hero,
  HowItWorks,
  LocaleSwitch,
  MarketingFooter,
  LogoBand,
  MarketingHeader,
  MediaSection,
  Pricing,
  Testimonials,
} from "@zedtech/zedkit-ui/marketing";
import { marketingCopy } from "@/components/demos/i18n/marketing-copy";

export function GlassSurfaceDemo() {
  const { plain, raised, tinted } = marketingCopy.surface;
  return (
    <Stack direction="horizontal" gap={4} className="min-w-0 flex-wrap items-stretch">
      <GlassSurface className="min-w-0 flex-1 basis-48">
        <Heading level={3}>{plain.title}</Heading>
        <Text variant="muted">{plain.body}</Text>
      </GlassSurface>
      <GlassSurface tone="raised" className="min-w-0 flex-1 basis-48">
        <Heading level={3}>{raised.title}</Heading>
        <Text variant="muted">{raised.body}</Text>
      </GlassSurface>
      <GlassSurface tone="tinted" className="min-w-0 flex-1 basis-48">
        <Heading level={3}>{tinted.title}</Heading>
        <Text variant="muted">{tinted.body}</Text>
      </GlassSurface>
    </Stack>
  );
}

export function HeroDemo() {
  const { hero } = marketingCopy;
  return (
    <Hero
      eyebrow={hero.eyebrow}
      title={hero.title}
      description={hero.description}
      headingLevel={2}
      actions={
        <>
          <Button size="lg">{hero.primary}</Button>
          <Button size="lg" variant="outline">
            {hero.secondary}
          </Button>
        </>
      }
    />
  );
}

export function CtaBandDemo() {
  const { cta } = marketingCopy;
  return <CtaBand title={cta.title} description={cta.description} actions={<Button size="lg">{cta.action}</Button>} />;
}

export function FeatureGridDemo() {
  const { features } = marketingCopy;
  return <FeatureGrid title={features.title} description={features.description} features={[...features.items]} />;
}

export function HowItWorksDemo() {
  const { steps } = marketingCopy;
  return <HowItWorks title={steps.title} steps={[...steps.items]} />;
}

export function MarketingChromeDemo() {
  const { chrome } = marketingCopy;
  return (
    <Stack gap={4} className="min-w-0">
      <MarketingHeader
        sticky={false}
        brand={
          <a href="#chrome" className="inline-flex min-h-11 items-center font-semibold">
            {chrome.brand}
          </a>
        }
        links={[
          <a key="docs" href="#chrome">
            {chrome.links.docs}
          </a>,
          <a key="pricing" href="#chrome">
            {chrome.links.pricing}
          </a>,
        ]}
        actions={<Button size="sm">{chrome.signUp}</Button>}
      />
      <MarketingFooter
        brand={<Text as="span" className="font-semibold">{chrome.brand}</Text>}
        description={chrome.tagline}
        columns={[
          {
            title: chrome.product,
            links: [
              <a key="docs" href="#chrome">
                {chrome.links.docs}
              </a>,
              <a key="pricing" href="#chrome">
                {chrome.links.pricing}
              </a>,
            ],
          },
          {
            title: chrome.company,
            links: [
              <a key="about" href="#chrome">
                {chrome.about}
              </a>,
            ],
          },
        ]}
        legal={<Text as="span" variant="muted">{chrome.legal}</Text>}
      />
    </Stack>
  );
}

export function LocaleSwitchDemo() {
  const { chrome } = marketingCopy;
  return (
    <LocaleSwitch
      current="en"
      locales={chrome.locales.map((locale) => ({ ...locale, href: `#${locale.code}` }))}
    />
  );
}

export function MediaSectionDemo() {
  const { media } = marketingCopy;
  return (
    <MediaSection
      title={media.title}
      description={media.description}
      points={[...media.points]}
      media={<Text variant="muted">{media.caption}</Text>}
    />
  );
}

export function LogoBandDemo() {
  const { logos } = marketingCopy;
  return (
    <LogoBand
      title={logos.title}
      logos={logos.names.map((name) => ({
        name,
        logo: (
          <Text as="span" className="font-semibold">
            {name}
          </Text>
        ),
      }))}
    />
  );
}

export function TestimonialsDemo() {
  const { testimonials } = marketingCopy;
  return <Testimonials title={testimonials.title} items={[...testimonials.items]} />;
}

export function PricingDemo() {
  const { pricing } = marketingCopy;
  return (
    <Pricing
      title={pricing.title}
      description={pricing.description}
      plans={pricing.plans.map((plan, index) => ({
        name: plan.name,
        price: plan.price,
        period: pricing.period,
        features: [...plan.features],
        action: <Button variant={index === 1 ? "default" : "outline"}>{plan.action}</Button>,
        highlighted: index === 1,
        badge: index === 1 ? pricing.badge : undefined,
      }))}
    />
  );
}

export function FaqDemo() {
  const { faq } = marketingCopy;
  return <Faq title={faq.title} items={[...faq.items]} />;
}
