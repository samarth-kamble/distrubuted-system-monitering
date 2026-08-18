import { AdminSettingsView } from "@/features/admin/components/admin-settings-view";

export const metadata = {
  title: "Organization Settings | PulseGuard Admin",
  description: "Configure tenant details and organization name/bio.",
};

export default function AdminSettingsPage() {
  return <AdminSettingsView />;
}
