/** English copy for the tabs demos. Keys only; no markup. */
export const tabsCopy = {
  controlled: {
    title: "Clinic agenda",
    description: "Dr. Amara Diallo · Rue des Lilas",
    showing: (label: string) => `Showing: ${label}`,
    jump: "Jump to the month",
    range: "Agenda range",
    day: { label: "Day", detail: "Tuesday 27 October: 6 appointments, first at 08:30." },
    week: { label: "Week", detail: "Week 44: 31 appointments, busiest day is Thursday." },
    month: { label: "Month", detail: "October: 118 appointments, 4 free slots left on Friday." },
  },
  project: {
    title: "Website relaunch",
    description: "Harbor Studio · due 14 November",
    sections: "Project sections",
    overview: "Overview",
    tasks: "Tasks",
    activity: "Activity",
    progress: "Project progress, 55 percent",
    done: "11 of 20 tasks done",
    owner: "Owner",
    ownerName: "Maya Laurent",
    team: "Team",
    teamSize: "4 people",
    status: "Status",
    onTrack: "On track",
    milestone: "Next milestone",
    milestoneValue: "Design review, 3 November",
    task: "Task",
    statusColumn: "Status",
    rows: [
      { name: "Homepage layout", status: "Done" },
      { name: "Case study pages", status: "In review" },
      { name: "Contact form", status: "Active" },
      { name: "Launch checklist", status: "To do" },
    ],
    feed: [
      { who: "Leo Martin", what: "moved “Case study pages” to In review", when: "10 min ago" },
      { who: "Maya Laurent", what: "closed “Homepage layout”", when: "2 h ago" },
      { who: "Sam Okafor", what: "commented on “Contact form”", when: "Yesterday" },
    ],
  },
} as const;

export type TabsCopy = typeof tabsCopy;
