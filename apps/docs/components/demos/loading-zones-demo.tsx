import {
  CardSkeleton,
  DataTableSkeleton,
  DetailPanelSkeleton,
  PageHeaderSkeleton,
  Stack,
} from "@zedtech/zedkit-ui";
import { loadingZonesCopy } from "@/components/demos/i18n/loading-zones-copy";

export function LoadingZonesDemo() {
  return (
    <Stack gap={4}>
      <PageHeaderSkeleton label={loadingZonesCopy.page} />
      <CardSkeleton label={loadingZonesCopy.card} />
      <DetailPanelSkeleton label={loadingZonesCopy.details} rows={2} />
      <DataTableSkeleton label={loadingZonesCopy.table} columns={3} rows={2} />
    </Stack>
  );
}
