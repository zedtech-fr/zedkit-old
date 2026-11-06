# Reference goal — approved decisions (Nov 2026)

Product choices for the `goal/reference` work. Implementation spans docs, UI kit, and the identity widget lane.

| ID | Decision |
|---|---|
| D1 | Widget identity applies to **demo specimens only** (not whole-site chrome) for now. |
| D2 | Open widget with **Cmd/Ctrl+I**; mobile UI is a **bottom sheet** (not full-screen). |
| D3 | Keep **Glass** as the default identity; add **type + motion** signature language (no new default identity). Tide stays a shipped opt-in look, not the site default. See [signature.md](./signature.md). Runtime: `apps/docs/lib/default-identity.ts`. |
| D4 | Brief-routed compositions: **commerce**, **SaaS dashboard**, **editorial**, **booking** (`selectSpecimenDomain` + `@zedtech/zedkit-ui/marketing` specimens). |
| D5 | Merge `goal/reference` into `main` **lot by lot** after dev review. |

Widget behavior (D1, D2) is implemented in the identity dock workstream; kit and docs record the contract here so previews and export stay aligned.
