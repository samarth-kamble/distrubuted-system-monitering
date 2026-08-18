import { AdminAuditLogsView } from "@/features/admin/components/admin-audit-logs-view";

export const metadata = {
  title: "Audit Trail | PulseGuard Admin",
  description: "View immutable tenant operation audit logs.",
};

export default function AdminAuditPage() {
  return <AdminAuditLogsView />;
}
