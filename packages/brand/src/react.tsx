import type { ReactElement, SVGProps } from "react";
import { BRAND_INK, BRAND_NAME, BRAND_PAPER, logoGeometry, type LogoVariant } from "./geometry.js";
import type { LogoTheme } from "./svg.js";

export interface ZedkitLogoProps extends Omit<SVGProps<SVGSVGElement>, "viewBox" | "title" | "children"> {
  /** `lockup` by default: mark and wordmark side by side. */
  variant?: LogoVariant;
  /**
   * `current` by default: the logo follows the text colour, so light, dark and any
   * theme restyle it with no second asset. `on-light` and `on-dark` pin the brand
   * colours. `auto` is for standalone files and falls back to `current` here.
   */
  theme?: LogoTheme;
  /**
   * Accessible name. Defaults to "zedkit". Pass an empty string when the name is already
   * written next to the logo, so screen readers skip it.
   */
  title?: string;
}

function color(theme: LogoTheme): string {
  if (theme === "on-light") return BRAND_INK;
  if (theme === "on-dark") return BRAND_PAPER;
  return "currentColor";
}

/**
 * The zedkit logo as an inline SVG. Size it with `height` (or a class); the width follows the
 * aspect ratio. The default height is `1.5em`, so it scales with the surrounding text.
 */
export function ZedkitLogo({
  variant = "lockup",
  theme = "current",
  title = BRAND_NAME,
  height = "1.5em",
  ...props
}: ZedkitLogoProps): ReactElement {
  const { viewBox, shapes } = logoGeometry(variant);
  const decorative = title === "";
  const paint = color(theme);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      height={height}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
      focusable="false"
      data-slot="zedkit-logo"
      {...props}
    >
      {decorative ? null : <title>{title}</title>}
      <g fill={paint} stroke={paint}>
        {shapes.map((shape) => (
          <path
            key={shape.d}
            d={shape.d}
            strokeWidth={shape.strokeWidth}
            strokeLinejoin={shape.strokeWidth > 0 ? "round" : undefined}
            transform={shape.transform}
          />
        ))}
      </g>
    </svg>
  );
}
