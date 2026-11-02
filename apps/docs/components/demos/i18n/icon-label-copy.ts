/** English copy for the icon label demos. Keys only; no markup. */
export const iconLabelCopy = {
  areas: {
    intro: "Four areas. The icon is decorative; the name stays.",
    build: "Build a UI",
    core: "Core & server",
    seo: "Improve SEO",
    agents: "Set up coding agents",
  },
  project: {
    title: "Spring campaign",
    summary: "Landing page, launch email and three social posts.",
    studio: "Harbor Studio",
    due: "Due Nov 14",
    members: "4 members",
    comments: "12 comments",
  },
  orders: {
    label: "Recent orders",
    delivered: { number: "#1042", item: "Linen shirt, size M", state: "Delivered Oct 22" },
    shipped: { number: "#1043", item: "Canvas tote bag", state: "Shipped Oct 25" },
    packing: { number: "#1044", item: "Ceramic mug set (4)", state: "Packing" },
    returned: { number: "#1045", item: "Wool scarf, grey", state: "Return requested" },
  },
} as const;

export type IconLabelCopy = typeof iconLabelCopy;
