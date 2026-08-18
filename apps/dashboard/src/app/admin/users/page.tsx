import { AdminUsersView } from "@/features/admin/components/admin-users-view";

export const metadata = {
  title: "User Directory | PulseGuard Admin",
  description: "Manage system operators and role permissions.",
};

export default function AdminUsersPage() {
  return <AdminUsersView />;
}
