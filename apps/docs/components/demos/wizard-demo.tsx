"use client";

import { useState } from "react";
import { Button, OptionCards, Stack, Text, WizardSteps } from "@zedtech/zedkit-ui";
import { wizardCopy } from "@/components/demos/i18n/wizard-copy";

const STEPS = [wizardCopy.steps.products, wizardCopy.steps.shipping, wizardCopy.steps.launch];

const PRODUCTS = [
  { id: "physical", ...wizardCopy.products.physical },
  { id: "digital", ...wizardCopy.products.digital },
  { id: "services", ...wizardCopy.products.services },
  { id: "gift", ...wizardCopy.products.gift },
];

const SHIPPING = [
  { id: "standard", ...wizardCopy.shipping.standard },
  { id: "express", ...wizardCopy.shipping.express },
  { id: "pickup", ...wizardCopy.shipping.pickup },
];

export function WizardDemo() {
  const [step, setStep] = useState(0);
  const [products, setProducts] = useState(["physical"]);
  const [shipping, setShipping] = useState(["standard"]);
  const picked = (list: readonly { id: string; title: string }[], ids: string[]) =>
    list.filter((entry) => ids.includes(entry.id)).map((entry) => entry.title.toLowerCase());

  return (
    <Stack gap={4} className="min-w-0">
      <WizardSteps steps={STEPS} current={step} />
      {step === 0 ? (
        <OptionCards label={wizardCopy.productsLabel} options={PRODUCTS} selected={products} onChange={setProducts} />
      ) : null}
      {step === 1 ? (
        <OptionCards label={wizardCopy.shippingLabel} options={SHIPPING} selected={shipping} onChange={setShipping} />
      ) : null}
      {step === 2 ? (
        <Text role="status">
          {wizardCopy.ready(picked(PRODUCTS, products), picked(SHIPPING, shipping))}
        </Text>
      ) : null}
      <Stack direction="horizontal" gap={2}>
        <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
          {wizardCopy.back}
        </Button>
        <Button disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)}>
          {wizardCopy.continue}
        </Button>
      </Stack>
    </Stack>
  );
}
