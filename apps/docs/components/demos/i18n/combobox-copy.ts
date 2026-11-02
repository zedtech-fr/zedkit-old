export const comboboxCopy = {
  cities: [
    { value: "paris", label: "Paris" },
    { value: "lyon", label: "Lyon" },
    { value: "marseille", label: "Marseille" },
    { value: "toulouse", label: "Toulouse" },
  ],
  officeCityAriaLabel: "Office city",
  placeholder: "Search cities…",
  selected: (label: string) => `Selected: ${label}`,
  filterHint: "Type to filter the list.",
} as const;

export type ComboboxCopy = typeof comboboxCopy;
