import AppShell from "@/components/AppShell";
import DemoResetClient from "@/components/pages/DemoResetClient";

// PRD §14.X — admin-only demo reset + canned scenario launcher.
export default function Page() {
  return (
    <AppShell>
      <DemoResetClient />
    </AppShell>
  );
}
