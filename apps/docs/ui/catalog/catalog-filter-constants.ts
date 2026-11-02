import type { CatalogArea } from "@/content/catalog-index";

export const AREAS: { id: CatalogArea | "all"; label: string }[] = [
  { id: "all", label: "All areas" },
  { id: "ui", label: "UI" },
  { id: "backend", label: "Core & server" },
  { id: "seo", label: "SEO" },
  { id: "agents", label: "Agents" },
];

export function areaLabel(id: CatalogArea | "all") {
  return AREAS.find((row) => row.id === id)?.label ?? id;
}
