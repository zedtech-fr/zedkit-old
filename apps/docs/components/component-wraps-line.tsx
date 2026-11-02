import Link from "next/link";
import { Text } from "@zedtech/zedkit-ui";
import { componentWrapsLineCopy } from "@/components/i18n/component-wraps-line-copy";

/** Catalog `wraps` field: backtick-separated npm names and plain notes. */
export function parseWrapTokens(wraps: string): string[] {
  const tokens = [...wraps.matchAll(/`([^`]+)`/g)].map((match) => match[1]!);
  if (tokens.length > 0) return tokens;
  const trimmed = wraps.trim();
  return trimmed.length > 0 ? [trimmed] : [];
}

function npmHref(name: string): string | null {
  if (name === "(none)" || name.includes(" ")) return null;
  if (/^@[\w-]+\/[\w.-]+$/.test(name) || /^[\w.-]+$/.test(name)) {
    return `https://www.npmjs.com/package/${encodeURIComponent(name)}`;
  }
  return null;
}

export function ComponentWrapsLine({ wraps }: { wraps: string }) {
  const tokens = parseWrapTokens(wraps);
  if (tokens.length === 0) return null;
  return (
    <Text variant="muted" className="text-sm">
      {componentWrapsLineCopy.prefix}{" "}
      {tokens.map((token, index) => {
        const href = npmHref(token);
        return (
          <Text as="span" key={`${token}-${index}`}>
            {index > 0 ? ", " : null}
            {href ? (
              <Link href={href} className="font-mono text-foreground underline-offset-4 hover:underline">
                {token}
              </Link>
            ) : (
              <Text as="span" className="font-mono text-foreground">
                {token}
              </Text>
            )}
          </Text>
        );
      })}
    </Text>
  );
}
