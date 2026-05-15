import AppShell from "@/components/AppShell";
import MedReconciliationClient from "@/components/pages/MedReconciliationClient";

export default async function Page({ params }: { params: Promise<{ encounterId: string }> }) {
  const { encounterId } = await params;
  return (
    <AppShell>
      <MedReconciliationClient encounterId={encounterId} />
    </AppShell>
  );
}
