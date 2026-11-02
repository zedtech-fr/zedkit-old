/**
 * English copy and sample data for the home identity examples, one block per identity.
 * Each block is a different product screen; names and numbers are made up.
 */

const eur = new Intl.NumberFormat("en", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/** Shared by the two examples that show money. */
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

  /** Tide: invoicing for a small business. Totals, a filter and a nudge per late invoice. */
  tide: {
    heading: "Invoices",
    description: "What you are owed, and who to nudge.",
    stats: { outstanding: "Outstanding", paid: "Paid this month", overdue: "Overdue" },
    overdueCount: (count: number) => (count === 1 ? "1 invoice" : `${count} invoices`),
    filtersAriaLabel: "Filter invoices",
    filters: { all: "All", overdue: "Overdue", paid: "Paid" },
    listAriaLabel: "Invoices",
    statuses: {
      paid: { label: "Paid", tone: "success" },
      due: { label: "Due", tone: "secondary" },
      overdue: { label: "Overdue", tone: "destructive" },
    },
    dueOn: (date: string) => `Due ${date}`,
    paidOn: (date: string) => `Paid ${date}`,
    remind: "Send reminder",
    remindAria: (client: string) => `Send reminder: ${client}`,
    reminded: "Reminder sent",
    remindedMessage: (client: string) => `Reminder to ${client} marked as sent. This demo sends no email.`,
    invoices: [
      { id: "nord", client: "Studio Nord", amount: 4200, date: "28 Oct", status: "overdue" },
      { id: "riviere", client: "Atelier Rivière", amount: 2980, date: "12 Nov", status: "due" },
      { id: "maree", client: "Marée Haute", amount: 1800, date: "20 Oct", status: "overdue" },
      { id: "port", client: "Port & Co", amount: 3500, date: "18 Nov", status: "due" },
      { id: "cobalt", client: "Bleu Cobalt", amount: 1240, date: "24 Oct", status: "paid" },
      { id: "kelp", client: "Kelp Studio", amount: 7680, date: "30 Oct", status: "paid" },
    ],
  },

  /** Volt: an on-call view. Many short rows, a filter and an error budget. */
  volt: {
    heading: "Incidents",
    description: "eu-1 and us-2, last 24 hours.",
    live: "Live",
    filterLabel: "Filter events",
    filterPlaceholder: "service or message",
    openOnlyLabel: "Open only",
    budgetLabel: "Error budget left",
    budgetValue: 72,
    listAriaLabel: "Recent incidents",
    openCount: (count: number) => `${count} open`,
    ack: "Ack",
    acked: "Acked",
    ackAria: (event: string) => `Acknowledge: ${event}`,
    empty: "No events match.",
    events: [
      { id: "latency", time: "09:41", service: "api-eu", event: "p95 latency 1.8 s for 5 min", tone: "warning", acked: false },
      { id: "queue", time: "09:38", service: "queue", event: "depth 4.1k, workers 6/8", tone: "warning", acked: false },
      { id: "auth", time: "09:12", service: "auth", event: "token refresh errors 0.4%", tone: "danger", acked: false },
      { id: "replica", time: "08:57", service: "db-eu-1", event: "replica lag 12 s", tone: "warning", acked: false },
      { id: "backup", time: "08:30", service: "backup", event: "eu-1 snapshot finished", tone: "success", acked: true },
      { id: "deploy", time: "07:55", service: "deploy", event: "console@4.8.2 rolled out", tone: "success", acked: true },
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

  /** Glass: a SaaS app. Usage on frosted cards, and an invite popover above them. */
  glass: {
    heading: "Usage",
    description: "Lumen Pro, renews 1 December.",
    stats: [
      { label: "Active users", value: "12,480" },
      { label: "Events today", value: "3.2M" },
    ],
    quotasAriaLabel: "Plan limits",
    quotas: [
      { id: "calls", label: "API calls", used: 8.2, limit: 10, unit: "M" },
      { id: "storage", label: "Storage", used: 41, limit: 100, unit: "GB" },
    ],
    quotaText: (used: number, limit: number, unit: string) => `${used} of ${limit} ${unit}`,
    teamHeading: "Team",
    teamAriaLabel: "Team members",
    members: [
      { id: "maya", name: "Maya Laurent", role: "Owner" },
      { id: "leo", name: "Leo Martin", role: "Admin" },
    ],
    invite: "Invite teammate",
    inviteTitle: "Invite by email",
    emailLabel: "Work email",
    emailPlaceholder: "name@company.com",
    send: "Send invite",
    invitedRole: "Invited",
    invitedMessage: (email: string) => `${email} added as invited. This demo sends no email.`,
  },
} as const;
