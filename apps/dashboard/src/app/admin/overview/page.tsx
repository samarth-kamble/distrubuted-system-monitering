import { AdminOverviewView } from "@/features/admin/components/admin-overview-view";

export const metadata = {
  title: "Compliance Overview | PulseGuard Admin",
  description: "Monitor security compliance score and metrics.",
};

export default function AdminOverviewPage() {
  return <AdminOverviewView />;
}
