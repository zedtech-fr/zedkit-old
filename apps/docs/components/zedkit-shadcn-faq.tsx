import { Heading, Stack, Text } from "@zedtech/zedkit-ui";

import { zedkitShadcnFaqCopy } from "@/components/i18n/zedkit-shadcn-faq-copy";
import { registryBrickNames } from "@/content/registry-site";
import { zedkitShadcnFaq } from "@/lib/zedkit-shadcn-faq";

import { JsonLd } from "./json-ld";

export function ZedkitShadcnFaq() {
  const entries = zedkitShadcnFaq(registryBrickNames.length);
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
  return (
    <>
      <JsonLd data={faqPage} />
      <Stack gap={6}>
        <Heading level={2}>{zedkitShadcnFaqCopy.heading}</Heading>
        {entries.map(({ question, answer }) => (
          <Stack key={question} gap={2}>
            <Heading level={3}>{question}</Heading>
            <Text as="p" variant="muted">
              {answer}
            </Text>
          </Stack>
        ))}
      </Stack>
    </>
  );
}
