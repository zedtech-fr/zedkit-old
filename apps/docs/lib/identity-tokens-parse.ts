// Split point: `parseIdentityTokens` pulls the zod runtime (~30 kB gzip). The identity assistant store mounts in the
// root provider, so a static import puts zod in every page's first load. Callers load this module on demand.
export { parseIdentityTokens } from "@zedtech/zedkit-ui";
