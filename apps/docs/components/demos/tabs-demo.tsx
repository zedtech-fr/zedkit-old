import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DetailPanel,
  ProgressBar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from "@zedtech/zedkit-ui";
import { tabsCopy } from "@/components/demos/i18n/tabs-copy";

const tasks = [
  { ...tabsCopy.project.rows[0], tone: "success" },
  { ...tabsCopy.project.rows[1], tone: "warning" },
  { ...tabsCopy.project.rows[2], tone: "secondary" },
  { ...tabsCopy.project.rows[3], tone: "outline" },
] as const;

const activity = tabsCopy.project.feed;

/** A project page: one heading, three panels that share its context. */
export function TabsDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{tabsCopy.project.title}</CardTitle>
        <CardDescription>{tabsCopy.project.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList aria-label={tabsCopy.project.sections}>
            <TabsTrigger value="overview">{tabsCopy.project.overview}</TabsTrigger>
            <TabsTrigger value="tasks">{tabsCopy.project.tasks}</TabsTrigger>
            <TabsTrigger value="activity">{tabsCopy.project.activity}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Stack gap={4}>
              <ProgressBar value={55} label={tabsCopy.project.progress} />
              <Text variant="muted">{tabsCopy.project.done}</Text>
              <DetailPanel
                items={[
                  { label: tabsCopy.project.owner, value: tabsCopy.project.ownerName },
                  { label: tabsCopy.project.team, value: tabsCopy.project.teamSize },
                  { label: tabsCopy.project.status, value: <Badge variant="success">{tabsCopy.project.onTrack}</Badge> },
                  { label: tabsCopy.project.milestone, value: tabsCopy.project.milestoneValue },
                ]}
              />
            </Stack>
          </TabsContent>

          <TabsContent value="tasks">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tabsCopy.project.task}</TableHead>
                  <TableHead>{tabsCopy.project.statusColumn}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.name}>
                    <TableCell>{task.name}</TableCell>
                    <TableCell>
                      <Badge variant={task.tone}>{task.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="activity">
            <Stack gap={3}>
              {activity.map((entry) => (
                <Stack key={entry.what} gap={1}>
                  <Text>
                    <strong>{entry.who}</strong> {entry.what}
                  </Text>
                  <Text variant="muted">{entry.when}</Text>
                </Stack>
              ))}
            </Stack>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
