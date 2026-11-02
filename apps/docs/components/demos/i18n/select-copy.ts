/** English copy for the select demo. Keys only; no markup. */
export const selectCopy = {
  label: "Pick a region",
  placeholder: "Pick a region",
  europe: "Europe",
  americas: "Americas",
  apac: "Asia-Pacific",
  empty: "Shipping options depend on the region.",
  delivery: {
    eu: "Delivery in 2 to 3 working days.",
    us: "Delivery in 5 to 7 working days.",
    apac: "Delivery in 7 to 10 working days.",
  },
} as const;

export type SelectCopy = typeof selectCopy;
