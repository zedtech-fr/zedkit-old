/** Props surfaced first on unified component pages (R2 template). */
export const DEFAULT_PROPS_PRIORITY = ["variant", "size", "asChild"];

/**
 * Splits a props list into kit props (shown) and inherited attributes
 * (folded). A prop is a kit prop when the page prioritises it, when it is
 * required, or when the kit itself declares it (`origin === "kit"`). Order:
 * required props, then the page's priority list, then the rest as declared.
 *
 * Ownership comes from where the property is declared (see
 * `declarationOrigin`), never from its name: `direction` is an SVG attribute
 * and a Stack option, `dirName` is a textarea attribute and nothing else.
 *
 * @template {{ name: string, required?: boolean, origin?: "kit" | "inherited" }} T
 * @param {T[]} entries
 * @param {string[]} [priority]
 * @param {boolean} [only] show the priority list only; everything else folds
 * @returns {{ primary: T[], inherited: T[] }}
 */
export function partitionPropsEntries(entries, priority = DEFAULT_PROPS_PRIORITY, only = false) {
  const order = new Map(priority.map((name, index) => [name, index]));
  const rank = (entry) => (entry.required ? -1 : order.has(entry.name) ? order.get(entry.name) : priority.length);
  const primary = [];
  const inherited = [];
  for (const entry of entries) {
    const kit = order.has(entry.name) || (!only && (entry.required || entry.origin === "kit"));
    (kit ? primary : inherited).push(entry);
  }
  primary.sort((a, b) => rank(a) - rank(b));
  inherited.sort((a, b) => a.name.localeCompare(b.name));
  return { primary, inherited };
}
