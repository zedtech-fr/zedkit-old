/** English copy for the home page. Keys only; no markup. */
import { homeComponentFamiliesCopy } from "@/ui/home/i18n/home-component-families-copy";
import { homeGetStartedCopy } from "@/ui/home/i18n/home-get-started-copy";
import { homeGalleryPreviewCopy } from "@/ui/home/i18n/home-gallery-copy";
import { homeHeroCopy } from "@/ui/home/i18n/home-hero-copy";
import { homeSecondaryCopy } from "@/ui/home/i18n/home-marketing-sections-copy";

export const homeCopy = {
  ...homeHeroCopy,
  getStarted: homeGetStartedCopy,
  componentFamilies: homeComponentFamiliesCopy,
  secondary: homeSecondaryCopy,
  galleryPreview: homeGalleryPreviewCopy,
} as const;

export type HomeCopy = typeof homeCopy;
