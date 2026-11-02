/** English copy for the note-list example page. Keys only; no markup. */
export const noteListExampleCopy = {
  metadata: {
    title: "Note list example",
    description:
      "A feature-folder example: fixture adapter, ports, pure reducer, typed copy, no backend.",
  },
  intro:
    "A runnable feature-folder example: a fixture adapter behind a port, a pure reducer, and typed copy — no backend. Add a note to try it.",
  read: "Read",
  patternLink: "how the pattern is enforced",
  patternLinkEnd: ".",
} as const;

export type NoteListExampleCopy = typeof noteListExampleCopy;
