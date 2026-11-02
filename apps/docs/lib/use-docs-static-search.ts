"use client";

import { useMemo } from "react";
import { useStaticSearch, type SearchResult, type StaticOptions } from "fumadocs-core/search/client";
import { docsSearchCanonicalByHref } from "@/content/docs-search-canonical";
import { rankAndGroupSearchItems } from "@/lib/docs-search-ranking.mjs";

type SearchItem = NonNullable<SearchResult["items"]>[number];

export function applyDocsSearchRanking(data: SearchResult | undefined): SearchResult | undefined {
  if (!data?.items?.length || !data.query.trim()) return data;
  const items = rankAndGroupSearchItems(
    data.items as Parameters<typeof rankAndGroupSearchItems>[0],
    data.query,
    docsSearchCanonicalByHref,
  );
  return { ...data, items: items as SearchItem[] };
}

export function useDocsStaticSearch(options: StaticOptions = {}) {
  const result = useStaticSearch({ search: { tolerance: 1 }, ...options });
  const data = useMemo(() => applyDocsSearchRanking(result.data), [result.data]);
  return { ...result, data };
}
