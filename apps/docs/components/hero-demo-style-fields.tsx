"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, identities } from "@zedtech/zedkit-ui";

import { heroDemoStyleCopy } from "@/components/i18n/hero-demo-style-copy";

export type HeroDemoModePin = "follow" | "light" | "dark";

const MODES = [
  { id: "follow", label: heroDemoStyleCopy.modes.follow },
  { id: "light", label: heroDemoStyleCopy.modes.light },
  { id: "dark", label: heroDemoStyleCopy.modes.dark },
] as const;

export function resolveHeroDemoDark(modePin: HeroDemoModePin, siteDark: boolean): boolean {
  if (modePin === "follow") return siteDark;
  return modePin === "dark";
}

const PREVIEW_MODES = [
  { id: "ready", label: heroDemoStyleCopy.previewModes.ready },
  { id: "loading", label: heroDemoStyleCopy.previewModes.loading },
  { id: "empty", label: heroDemoStyleCopy.previewModes.empty },
  { id: "error", label: heroDemoStyleCopy.previewModes.error },
] as const;

export function HeroDemoIdentitySelect({ look, onLook }: { look: string; onLook: (id: string) => void }) {
  return (
    <Select value={look} onValueChange={onLook}>
      <SelectTrigger
        className="h-9 w-full min-w-0 border-border/70 bg-transparent shadow-none sm:w-32"
        aria-label={heroDemoStyleCopy.identityAriaLabel}
        data-hero-look-select=""
      >
        <SelectValue placeholder={heroDemoStyleCopy.identityPlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {identities.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function HeroDemoModeSelect({
  modePin,
  onModePin,
}: {
  modePin: HeroDemoModePin;
  onModePin: (pin: HeroDemoModePin) => void;
}) {
  return (
    <Select value={modePin} onValueChange={(value) => onModePin(value as HeroDemoModePin)}>
      <SelectTrigger
        className="h-9 w-full min-w-0 border-border/70 bg-transparent shadow-none sm:w-24"
        aria-label={heroDemoStyleCopy.modeAriaLabel}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MODES.map((mode) => (
          <SelectItem key={mode.id} value={mode.id}>
            {mode.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function HeroDemoPreviewSelect({
  preview,
  onPreview,
  className,
}: {
  preview: string;
  onPreview: (mode: string) => void;
  className?: string;
}) {
  return (
    <Select value={preview} onValueChange={onPreview}>
      <SelectTrigger
        className={`h-9 w-full min-w-0 border-border/70 bg-transparent shadow-none sm:w-28 ${className ?? ""}`}
        aria-label={heroDemoStyleCopy.previewAriaLabel}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PREVIEW_MODES.map((mode) => (
          <SelectItem key={mode.id} value={mode.id}>
            {mode.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
