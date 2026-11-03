type IdentityOption = {
  id: string;
  label: string;
  /** One line that says what the look is for. */
  description?: string;
  /** Font families the identity names, so a preview can fetch them before it starts. */
  fonts?: readonly string[];
};

/** localStorage key holding the chosen identity id. */
const IDENTITY_STORAGE_KEY = "zk-identity";
/** localStorage key holding CSS for a custom identity sheet. */
const IDENTITY_CUSTOM_STORAGE_KEY = "zk-identity-custom";
/** `data-identity` value while a custom token sheet is active. */
const CUSTOM_IDENTITY_ID = "custom";
/** Prefix for saved named identities (`n-acme`). Built-in ids never use it. */
const NAMED_IDENTITY_PREFIX = "n-";

/** `n-` and a plain slug. The id is written into a `[data-identity="…"]` selector, so nothing else may pass. */
function isNamedIdentityId(id: string): boolean {
  return /^n-[a-z0-9-]{0,120}$/.test(id);
}

/** Extra option so a select/radio group can name a custom or named look that is not in the list. */
function identitiesWithCurrentLook(
  identities: readonly IdentityOption[],
  current: string,
  customLabel: string,
): readonly IdentityOption[] {
  if (!current || identities.some((item) => item.id === current)) return identities;
  if (current === CUSTOM_IDENTITY_ID) {
    return [{ id: CUSTOM_IDENTITY_ID, label: customLabel }, ...identities];
  }
  if (isNamedIdentityId(current)) {
    const slug = current.slice(NAMED_IDENTITY_PREFIX.length);
    return [{ id: current, label: slug || customLabel }, ...identities];
  }
  return identities;
}
/** `data-slot` on the custom identity `<style>` node. */
const IDENTITY_CUSTOM_SHEET_SLOT = "identity-custom-sheet";
/** Window event fired after the identity attribute changes. */
const IDENTITY_CHANGE_EVENT = "zk-identity-change";

function customIdentityStorageKey(storageKey: string): string {
  return storageKey === IDENTITY_STORAGE_KEY ? IDENTITY_CUSTOM_STORAGE_KEY : `${storageKey}-custom`;
}

/**
 * Identities shipped in `identities.css`, offered by default by
 * `IdentityScript`, `IdentitySwitcher` and `IdentityPicker`. Pass your own
 * list (ids matching your `[data-identity]` CSS) to offer other looks.
 */
const identities: readonly IdentityOption[] = [
  {
    id: "mist",
    label: "Mist",
    description: "Calm and soft: the everyday look.",
    fonts: ["Inter Variable"],
  },
  {
    id: "press",
    label: "Press",
    description: "Editorial: ink on paper, fine rules, serif titles.",
    fonts: ["Space Grotesk Variable", "Newsreader Variable", "JetBrains Mono Variable"],
  },
  {
    id: "tide",
    label: "Tide",
    description: "Navy and coral: bold, round, lively.",
    fonts: ["Inter Variable", "JetBrains Mono Variable"],
  },
  {
    id: "volt",
    label: "Volt",
    description: "Dense and dark: one electric accent.",
    fonts: ["Geist Variable", "JetBrains Mono Variable"],
  },
  {
    id: "maison",
    label: "Maison",
    description: "Brand boutique: ivory, serif, airy.",
    fonts: ["Cormorant Variable", "Jost Variable", "JetBrains Mono Variable"],
  },
  {
    id: "glass",
    label: "Glass",
    description: "Frosted glass: translucent layers over soft colour.",
    fonts: ["Space Grotesk Variable", "Inter Variable", "JetBrains Mono Variable"],
  },
];

export {
  CUSTOM_IDENTITY_ID,
  IDENTITY_CHANGE_EVENT,
  IDENTITY_CUSTOM_SHEET_SLOT,
  IDENTITY_CUSTOM_STORAGE_KEY,
  IDENTITY_STORAGE_KEY,
  NAMED_IDENTITY_PREFIX,
  customIdentityStorageKey,
  identities,
  identitiesWithCurrentLook,
  isNamedIdentityId,
  type IdentityOption,
};
