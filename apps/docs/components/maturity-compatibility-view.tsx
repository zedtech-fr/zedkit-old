import Link from "next/link";
import {
  Badge,
  Section,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@zedtech/zedkit-ui";
import {
  compatibilityRows,
  maturityCounts,
  workspaceToolchain,
} from "@/content/maturity-compatibility";
import { maturityCompatibilityCopy } from "@/components/i18n/maturity-compatibility-copy";
import { maturityBadgeClass, maturityBadgeVariant } from "@/lib/maturity-status";

// Same limits as docs/catalog/README.md#maturity. Wording lives in the copy module.
const MATURITY_LIMITS = [
  { status: "stable", showBadge: false },
  { status: "beta", showBadge: true },
  { status: "alpha", showBadge: true },
  { status: "planned", showBadge: true },
  { status: "deprecated", showBadge: true },
] as const;

function CountsTable() {
  const rows = Object.entries(maturityCounts).filter(([, n]) => n > 0);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{maturityCompatibilityCopy.countsTable.status}</TableHead>
          <TableHead>{maturityCompatibilityCopy.countsTable.needs}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(([status, count]) => (
          <TableRow key={status}>
            <TableCell>{status}</TableCell>
            <TableCell>{count}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function CompatibilityTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{maturityCompatibilityCopy.compatibilityTable.package}</TableHead>
          <TableHead>{maturityCompatibilityCopy.compatibilityTable.version}</TableHead>
          <TableHead>{maturityCompatibilityCopy.compatibilityTable.node}</TableHead>
          <TableHead>{maturityCompatibilityCopy.compatibilityTable.peers}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {compatibilityRows.map((row) => (
          <TableRow key={row.package}>
            <TableCell className="font-mono text-xs">{row.package}</TableCell>
            <TableCell>{row.version}</TableCell>
            <TableCell>{row.node}</TableCell>
            <TableCell className="text-muted-foreground">{row.peers}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function MaturityCompatibilityView() {
  return (
    <Stack gap={8}>
      <Section title={maturityCompatibilityCopy.sections.badgeMeaning}>
        <Stack gap={4}>
          {MATURITY_LIMITS.map((row) => (
            <Stack key={row.status} gap={2}>
              {row.showBadge ? (
                <Badge
                  variant={maturityBadgeVariant(maturityCompatibilityCopy.badges[row.status])}
                  className={`w-fit ${maturityBadgeClass(maturityCompatibilityCopy.badges[row.status])}`}
                >
                  {maturityCompatibilityCopy.badges[row.status]}
                </Badge>
              ) : (
                <Text className="font-medium">{maturityCompatibilityCopy.noBadge}</Text>
              )}
              <Text>{maturityCompatibilityCopy.limits[row.status]}</Text>
            </Stack>
          ))}
          <Text variant="muted">{maturityCompatibilityCopy.semverNote}</Text>
        </Stack>
      </Section>
      <Section title={maturityCompatibilityCopy.sections.counts}>
        <CountsTable />
      </Section>
      <Section title={maturityCompatibilityCopy.sections.toolchain}>
        <Text>
          {maturityCompatibilityCopy.toolchain(workspaceToolchain.node, workspaceToolchain.packageManager)}
          <Link href="/docs/ui/theme-an-admin-app-dark-light-included">{maturityCompatibilityCopy.themeDoc}</Link>
          {maturityCompatibilityCopy.toolchainTail}
        </Text>
      </Section>
      <Section title={maturityCompatibilityCopy.sections.compatibility}>
        <Stack gap={3}>
          <Text variant="muted">
            {maturityCompatibilityCopy.generatedLead}
            <code>package.json</code>
            {maturityCompatibilityCopy.generatedTail}
          </Text>
          <CompatibilityTable />
        </Stack>
      </Section>
    </Stack>
  );
}
