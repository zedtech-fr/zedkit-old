import { AppShell, PageHeader, Stack, Text } from "@zedtech/zedkit-ui";
import { appShellNoTopbarCopy } from "@/components/demos/i18n/app-shell-no-topbar-copy";

const NAV = appShellNoTopbarCopy.nav;

export function AppShellNoTopbarDemo() {
  return (
    <AppShell
      className="h-72 min-h-0 overflow-hidden rounded-lg border"
      sidebar={
        <Stack gap={1} className="p-3">
          <Text className="px-2 pb-2 font-semibold">{appShellNoTopbarCopy.brand}</Text>
          <nav aria-label={appShellNoTopbarCopy.navAriaLabel}>
            <Stack gap={1}>
              {NAV.map((item, index) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  aria-current={index === 0 ? "page" : undefined}
                  className="rounded-md px-2 py-1.5 text-sm hover:bg-accent aria-[current=page]:bg-accent aria-[current=page]:font-medium"
                >
                  {item}
                </a>
              ))}
            </Stack>
          </nav>
        </Stack>
      }
    >
      <PageHeader titleAs="h2" title={appShellNoTopbarCopy.pageTitle} description={appShellNoTopbarCopy.pageDescription} />
    </AppShell>
  );
}
