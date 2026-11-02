/** English copy for registry brick name lists. Keys only; no markup. */
export const registryBrickNameCopy = {
  published: (count: number) => `${count} published ${count === 1 ? "brick" : "bricks"}`,
  seeAll: "See all registry bricks",
} as const;

export type RegistryBrickNameCopy = typeof registryBrickNameCopy;
