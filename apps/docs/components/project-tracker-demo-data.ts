import type { BadgeProps } from "@zedtech/zedkit-ui";

import { projectTrackerDemoCopy } from "@/components/i18n/project-tracker-demo-copy";

/** Seed rows shared by the app shell demo and the home hero, so both tell the same story. */
export type TaskStatus = (typeof projectTrackerDemoCopy.status)[keyof typeof projectTrackerDemoCopy.status];

export interface TaskRow {
  id: string;
  title: string;
  owner: string;
  status: TaskStatus;
  /** ISO date (UTC), formatted on render so the output never depends on the viewer locale. */
  due: string;
}

export const STATUS_VARIANT: Record<TaskStatus, BadgeProps["variant"]> = {
  [projectTrackerDemoCopy.status.todo]: "outline",
  [projectTrackerDemoCopy.status.inProgress]: "secondary",
  [projectTrackerDemoCopy.status.inReview]: "warning",
  [projectTrackerDemoCopy.status.blocked]: "destructive",
  [projectTrackerDemoCopy.status.done]: "success",
};

const { people, status, tasks } = projectTrackerDemoCopy;

export const SEED_TASKS: TaskRow[] = [
  { id: "t-101", title: tasks.homepageCopy, owner: people.priya, status: status.inReview, due: "2026-11-03" },
  { id: "t-102", title: tasks.redirectUrls, owner: people.luca, status: status.inProgress, due: "2026-11-04" },
  { id: "t-103", title: tasks.heroImages, owner: people.tom, status: status.done, due: "2026-10-28" },
  { id: "t-104", title: tasks.typeface, owner: people.aiko, status: status.done, due: "2026-10-26" },
  { id: "t-105", title: tasks.contactForm, owner: people.luca, status: status.blocked, due: "2026-11-05" },
  { id: "t-106", title: tasks.checkout, owner: people.maya, status: status.inProgress, due: "2026-11-06" },
  { id: "t-107", title: tasks.pricingFrench, owner: people.priya, status: status.todo, due: "2026-11-10" },
  { id: "t-108", title: tasks.analytics, owner: people.tom, status: status.todo, due: "2026-11-12" },
  { id: "t-109", title: tasks.keyboard, owner: people.aiko, status: status.inReview, due: "2026-11-07" },
  { id: "t-110", title: tasks.archiveBlog, owner: people.maya, status: status.todo, due: "2026-11-18" },
  { id: "t-111", title: tasks.launchAnnouncement, owner: people.priya, status: status.todo, due: "2026-11-20" },
  { id: "t-112", title: tasks.a11yCheck, owner: people.aiko, status: status.todo, due: "2026-11-24" },
];
