/** Visual type role class names (pair with semantic `level` / tag in `Heading`). */
export const typeRoleClass = {
  display: "text-zk-type-display",
  title: "text-zk-type-section",
  heading: "text-zk-type-band",
  section: "text-zk-type-section",
  band: "text-zk-type-band",
  cardTitle: "text-zk-type-card-title",
  lead: "text-zk-type-lead",
  body: "text-zk-type-body",
  prose: "text-zk-type-prose",
  small: "text-zk-type-small",
  caption: "text-zk-type-label",
  label: "text-zk-type-label",
  nav: "text-zk-type-nav",
} as const;

export type TypeRole = keyof typeof typeRoleClass;

/** Default visual role for each semantic heading level when `role` is omitted. */
export const headingLevelDefaultRole: Record<1 | 2 | 3 | 4, TypeRole> = {
  1: "display",
  2: "title",
  3: "heading",
  4: "cardTitle",
};

/** Named signature motion utilities (CSS in signature-motion.css). */
export const signatureMotionClass = {
  reveal: "motion-reveal",
  settle: "motion-settle",
  emphasis: "motion-emphasis",
  glide: "motion-glide",
  feedback: "motion-feedback",
} as const;

export type SignatureMotion = keyof typeof signatureMotionClass;
