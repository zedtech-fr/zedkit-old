import { Badge } from "@zedtech/zedkit-ui";
import { badgeCopy } from "@/components/demos/i18n/badge-copy";

const JOBS = badgeCopy.tableRow.jobs;

export function BadgeTableRowDemo() {
  return (
    <table className="w-full min-w-0 text-left text-sm">
      <caption className="sr-only">{badgeCopy.tableRow.caption}</caption>
      <thead>
        <tr className="border-b text-muted-foreground">
          <th scope="col" className="py-2 pr-4 font-medium">{badgeCopy.tableRow.columns.job}</th>
          <th scope="col" className="py-2 pr-4 font-medium">{badgeCopy.tableRow.columns.target}</th>
          <th scope="col" className="py-2 font-medium">{badgeCopy.tableRow.columns.state}</th>
        </tr>
      </thead>
      <tbody>
        {JOBS.map((job) => (
          <tr key={job.name} className="border-b last:border-b-0">
            <td className="py-2 pr-4 font-medium">{job.name}</td>
            <td className="py-2 pr-4">{job.target}</td>
            <td className="py-2">
              <Badge variant={job.state === "done" ? "outline" : "secondary"}>{job.state}</Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
