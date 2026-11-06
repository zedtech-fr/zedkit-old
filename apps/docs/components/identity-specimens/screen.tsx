import type { SpecimenComposition } from "@/components/i18n/identity-specimen-compositions";
import { BookingScreen } from "@/components/identity-specimens/booking-screen";
import { CommerceScreen } from "@/components/identity-specimens/commerce-screen";
import { ConsoleScreen } from "@/components/identity-specimens/console-screen";
import { EditorialScreen } from "@/components/identity-specimens/editorial-screen";

/** One composition per métier; the card around it only supplies the scope and the frame. */
export function SpecimenScreen({ copy }: { copy: SpecimenComposition }) {
  switch (copy.kind) {
    case "commerce":
      return <CommerceScreen copy={copy} />;
    case "saas-dashboard":
      return <ConsoleScreen copy={copy} />;
    case "editorial":
      return <EditorialScreen copy={copy} />;
    case "booking":
      return <BookingScreen copy={copy} />;
  }
}
