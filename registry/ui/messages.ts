export type ZedkitUiMessages = {
  close: string;
  confirm: string;
  cancel: string;
  loading: string;
  progress: string;
  filter: string;
  empty: string;
  clearFilters: string;
  previous: string;
  next: string;
  /** Template with `{page}` and `{pageCount}`. */
  pageOf: string;
  /** Template with `{step}`, `{stepCount}`, and `{title}` (WizardSteps mobile summary). */
  wizardStepOf: string;
  copyToClipboard: string;
  live: string;
  idle: string;
  options: string;
  /** Combobox / multi-select search field placeholder. */
  search: string;
  /** Visible list loading line (ellipsis). */
  loadingEllipsis: string;
  /** Spinner accessible name while options load. */
  loadingOptions: string;
  /** Appended to a picked multi-select row, e.g. " (selected)". */
  selectedSuffix: string;
  /** Chip remove control; template `{label}`. */
  removeItem: string;
  identity: string;
  identityDescription: string;
  identityDefault: string;
  identityDefaultSuffix: string;
  identityCustom: string;
  scrollableTable: string;
  offlineTitle: string;
  offlineBody: string;
  updated: string;
  justNow: string;
  pickDate: string;
  pickDateRange: string;
  locale: "en" | "fr";
};

export const zedkitUiMessagesEn: ZedkitUiMessages = {
  close: "Close",
  confirm: "Confirm",
  cancel: "Cancel",
  loading: "Loading",
  progress: "Progress",
  filter: "Filter…",
  empty: "No results.",
  clearFilters: "Clear filters",
  previous: "Previous",
  next: "Next",
  pageOf: "Page {page} of {pageCount}",
  wizardStepOf: "Step {step} of {stepCount} · {title}",
  copyToClipboard: "Copy to clipboard",
  live: "Live",
  idle: "Idle",
  options: "Options",
  search: "Search…",
  loadingEllipsis: "Loading…",
  loadingOptions: "Loading options",
  selectedSuffix: " (selected)",
  removeItem: "Remove {label}",
  identity: "Identity",
  identityDescription: "The page behind this sheet updates as you choose.",
  identityDefault: "Default",
  identityDefaultSuffix: " (default)",
  identityCustom: "Custom",
  scrollableTable: "Scrollable table",
  offlineTitle: "You're offline.",
  offlineBody: "Changes will sync when you reconnect.",
  updated: "Updated",
  justNow: "just now",
  pickDate: "Pick a date",
  pickDateRange: "Pick a date range",
  locale: "en",
};

export const zedkitUiMessagesFr: ZedkitUiMessages = {
  close: "Fermer",
  confirm: "Confirmer",
  cancel: "Annuler",
  loading: "Chargement",
  progress: "Progression",
  filter: "Filtrer…",
  empty: "Aucun résultat.",
  clearFilters: "Effacer les filtres",
  previous: "Précédent",
  next: "Suivant",
  pageOf: "Page {page} sur {pageCount}",
  wizardStepOf: "Étape {step} sur {stepCount} · {title}",
  copyToClipboard: "Copier dans le presse-papiers",
  live: "En direct",
  idle: "Inactif",
  options: "Choix",
  search: "Rechercher…",
  loadingEllipsis: "Chargement…",
  loadingOptions: "Chargement des options",
  selectedSuffix: " (sélectionné)",
  removeItem: "Retirer {label}",
  identity: "Identité",
  identityDescription: "La page derrière ce panneau se met à jour quand vous choisissez.",
  identityDefault: "Défaut",
  identityDefaultSuffix: " (défaut)",
  identityCustom: "Personnalisé",
  scrollableTable: "Tableau défilable",
  offlineTitle: "Vous êtes hors ligne.",
  offlineBody: "Les changements se synchroniseront à la reconnexion.",
  updated: "Mis à jour",
  justNow: "à l'instant",
  pickDate: "Choisir une date",
  pickDateRange: "Choisir une période",
  locale: "fr",
};
