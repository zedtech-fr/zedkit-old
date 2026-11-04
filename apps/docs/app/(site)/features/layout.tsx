import type { ReactNode } from "react";

import { FeaturesAssistantStore } from "@/components/features-assistant-store";

export default function FeaturesLayout({ children }: { children: ReactNode }) {
  return <FeaturesAssistantStore>{children}</FeaturesAssistantStore>;
}
