function resolveModalMountAutoFocus(autoFocus: boolean | undefined, modal: boolean): boolean {
  return autoFocus ?? modal;
}

/** D5 overlay role: header/footer inherit the panel surface (no opaque chrome bands). */
const overlayDialogHeaderClass =
  "sticky top-0 z-10 flex flex-col gap-dialog-header-stack pr-dialog-header-end text-left";
const overlayDialogFooterClass =
  "sticky bottom-0 z-10 flex flex-col-reverse gap-2 pb-dialog-footer-safe sm:flex-row sm:justify-end sm:items-center";
const overlayDialogCloseClass =
  "absolute top-0 right-0 z-20 grid size-overlay-touch-target min-h-[45px] min-w-[45px] shrink-0 place-content-center rounded-sm opacity-70 focus-ring-control transition-opacity hover:opacity-100 disabled:pointer-events-none";

const overlayDrawerHeaderClass =
  "sticky top-0 z-10 flex shrink-0 flex-col gap-drawer-header-gap border-b border-border p-4 text-left";
const overlayDrawerFooterClass =
  "sticky bottom-0 z-10 mt-auto flex shrink-0 flex-col gap-2 border-t border-border px-4 pt-4 pb-drawer-footer-safe sm:flex-row sm:justify-end sm:items-center";

export {
  overlayDialogCloseClass,
  overlayDialogFooterClass,
  overlayDialogHeaderClass,
  overlayDrawerFooterClass,
  overlayDrawerHeaderClass,
  resolveModalMountAutoFocus,
};
