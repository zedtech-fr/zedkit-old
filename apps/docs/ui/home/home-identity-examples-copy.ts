/**
 * English copy and sample data for the home identity examples, one block per identity.
 * Each block is a different product screen; names and numbers are made up.
 */

const eur = new Intl.NumberFormat("en", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/** Money format for the shop example. */
export const formatEur = (value: number) => eur.format(value);

export const homeIdentityExamplesCopy = {
  /** Mist: a developer console. Project settings and the people who can change them. */
  mist: {
    heading: "Project settings",
    description: "Workspace name, region, and who gets incident mail.",
    status: "Active",
    workspaceLabel: "Workspace",
    workspaceValue: "Harbor Console",
    regionLabel: "Region",
    regionValue: "eu",
    regions: [
      { value: "eu", label: "Europe" },
      { value: "us", label: "Americas" },
      { value: "apac", label: "Asia-Pacific" },
    ],
    alertsLabel: "Email alerts",
    save: "Save changes",
    discard: "Discard",
    destroy: "Delete project",
    saved: "Changes saved.",
    discarded: "Changes discarded.",
    unsaved: "Unsaved changes.",
    deleted: "Deleted",
    deletedMessage: "Project deleted. Nothing was removed; this is a demo.",
    restore: "Restore project",
    deleteTitle: "Delete this project?",
    deleteDescription: "Members lose access immediately. This demo removes nothing.",
    deleteConfirm: "Delete project",
    tableAriaLabel: "Workspace members",
    columns: { member: "Member", role: "Role", status: "Status" },
    rows: [
      { member: "Maya Laurent", email: "maya@harbor.test", lastActive: "Today", role: "Owner", status: "Active", tone: "success" as const },
      { member: "Leo Martin", email: "leo@harbor.test", lastActive: "Not yet", role: "Admin", status: "Invited", tone: "warning" as const },
      { member: "Sam Okafor", email: "sam@harbor.test", lastActive: "Yesterday", role: "Member", status: "Active", tone: "secondary" as const },
    ],
    drawer: {
      description: "Workspace member",
      detailsAriaLabel: "Member details",
      email: "Email",
      status: "Status",
      lastActive: "Last active",
      roleLabel: "Role",
      roles: ["Owner", "Admin", "Member"],
      resend: "Resend invite",
      resent: (email: string) => `Invite to ${email} resent. This demo sends no email.`,
      save: "Save role",
      close: "Close",
    },
    alertTitle: "Billing ends 14 November",
    alertBody: "Add a payment method to keep the workspace after this period.",
  },

  /** Press: a newsroom. A queue of stories and an editor with a reading preview. */
  press: {
    heading: "Today's desk",
    description: "Stories moving through the edit. Pick one to work on it.",
    queueAriaLabel: "Story queue",
    columns: { story: "Story", status: "Status" },
    headlineLabel: "Headline",
    sectionLabel: "Section",
    standfirstLabel: "Standfirst",
    previewLabel: "Reading preview",
    publish: "Publish",
    saveDraft: "Save as draft",
    published: (headline: string) => `Published: ${headline}. This demo prints nothing.`,
    drafted: (headline: string) => `Back to draft: ${headline}.`,
    sections: [
      { value: "local", label: "Local" },
      { value: "business", label: "Business" },
      { value: "culture", label: "Culture" },
    ],
    statuses: {
      draft: { label: "Draft", tone: "secondary" },
      review: { label: "In review", tone: "warning" },
      scheduled: { label: "Scheduled", tone: "outline" },
      published: { label: "Published", tone: "success" },
    },
    stories: [
      {
        id: "ferry",
        headline: "The night ferry is back",
        section: "local",
        standfirst: "After two winters at the quay, the last crossing leaves at 23:40 again. Regulars say the town feels bigger already.",
        status: "draft",
      },
      {
        id: "fees",
        headline: "What the new port fees mean for small shops",
        section: "business",
        standfirst: "Most will pay less. Three importers will pay a lot more, and they have until March to adjust.",
        status: "review",
      },
      {
        id: "choir",
        headline: "Ninety voices, one shipyard",
        section: "culture",
        standfirst: "The choir rehearses between hulls on Thursday nights. The acoustics, it turns out, are excellent.",
        status: "scheduled",
      },
    ],
  },

  /** Maison: a bag shop's back office. A collection to browse and one piece to edit. */
  maison: {
    heading: "The autumn collection",
    description: "Pieces in the atelier and on the storefront.",
    listAriaLabel: "Collection",
    inStock: (count: number) => `${count} in stock`,
    lowStock: (count: number) => `${count} left`,
    hidden: "Not on the storefront",
    priceLabel: "Price (EUR)",
    stockLabel: "In stock",
    visibleLabel: "Show on the storefront",
    save: "Save piece",
    saved: (name: string) => `${name} saved. This demo keeps it on this page only.`,
    alertTitle: "Running low",
    alertBody: (name: string, count: number) => `${name}: ${count} left. Plan the next batch with the atelier.`,
    products: [
      { id: "cabas", name: "Cabas Grand", material: "Grained calfskin, ivory", price: 1450, stock: 6, visible: true },
      { id: "pochette", name: "Pochette Soir", material: "Smooth lambskin, ink", price: 890, stock: 2, visible: true },
      { id: "besace", name: "Besace Voyage", material: "Natural canvas, tan leather", price: 1180, stock: 9, visible: false },
    ],
  },
} as const;
