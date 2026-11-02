export const homeComponentFamiliesCopy = {
  section: {
    title: "Find a component",
    description: (componentCount: number) =>
      `${componentCount} UI entries in the catalog. Each name below opens a live doc page.`,
    browseAll: "Browse all UI in the catalog",
  },
  /** Every example is a live docs page; a family title is a plain heading, not a link. */
  families: [
    {
      label: "Actions",
      blurb: "Buttons, badges, icon actions and toasts.",
      examples: [
        { label: "Button", href: "/docs/ui/trigger-actions-with-buttons" },
        { label: "Icon button", href: "/docs/ui/icon-only-actions-with-a-visible-name" },
        { label: "Badge", href: "/docs/ui/show-a-status-or-count-badge" },
        { label: "Toaster", href: "/docs/ui/show-toast-notifications" },
      ],
    },
    {
      label: "Forms",
      blurb: "Inputs, selects, date pickers and validated forms.",
      examples: [
        { label: "Form", href: "/docs/ui/build-validated-forms-with-labels-errors-and-pending-state" },
        { label: "Input", href: "/docs/ui/collect-text-input-with-a-label" },
        { label: "Textarea", href: "/docs/ui/collect-multi-line-text-input" },
        { label: "Select", href: "/docs/ui/pick-one-option-from-a-dropdown" },
        { label: "Combobox", href: "/docs/ui/search-and-pick-one-option" },
        { label: "Multi-select", href: "/docs/ui/pick-many-searchable-options" },
        { label: "Checkbox", href: "/docs/ui/toggle-a-checkbox-or-a-switch" },
        { label: "Date picker", href: "/docs/ui/pick-a-date-from-a-popover" },
      ],
    },
    {
      label: "Overlays",
      blurb: "Dialogs, drawers, popovers, menus and tooltips.",
      examples: [
        { label: "Dialog", href: "/docs/ui/open-modal-dialogs" },
        { label: "Confirm dialog", href: "/docs/ui/confirm-destructive-actions" },
        { label: "Drawer", href: "/docs/ui/slide-in-a-drawer-panel" },
        { label: "Popover", href: "/docs/ui/float-extra-content-next-to-a-control" },
        { label: "Dropdown menu", href: "/docs/ui/open-a-menu-of-actions-from-a-button" },
        { label: "Tooltip", href: "/docs/ui/name-a-control-on-hover" },
        { label: "Route modal", href: "/docs/ui/render-a-route-as-a-modal-over-the-list" },
      ],
    },
    {
      label: "Data and states",
      blurb: "Tables, detail panels, cards, and loading, empty and error states.",
      examples: [
        { label: "Data table", href: "/docs/ui/show-a-sortable-filterable-paginated-data-table" },
        { label: "Detail panel", href: "/docs/ui/show-key-value-details-and-a-live-indicator" },
        { label: "Card", href: "/docs/ui/group-content-in-a-card-section" },
        { label: "Empty state", href: "/docs/ui/show-an-empty-zone-with-a-next-step" },
        { label: "Error state", href: "/docs/ui/show-what-broke-and-a-next-step" },
        { label: "Skeleton", href: "/docs/ui/show-loading-placeholder-blocks" },
      ],
    },
  ],
} as const;
