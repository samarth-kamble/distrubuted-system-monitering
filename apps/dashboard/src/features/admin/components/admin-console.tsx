"use client";

import { useState, useEffect } from "react";
import {
  Users,
  ShieldAlert,
  BarChart3,
  Search,
  UserCheck,
  Shield,
  Clock,
  Info,
  ShieldCheck,
  Power,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ThemeToggle } from "@/components/theme-toggle";

import {
  useAdminUsers,
  useUpdateUserRole,
  useAdminAuditLogs,
  useCreateTenantUser,
  useUpdateTenantSettings,
} from "../hooks/use-admin";
import { toast } from "sonner";
import { Loader2, Settings } from "lucide-react";

export function AdminConsole() {
  const [activeTab, setActiveTab] = useState<"users" | "audit" | "overview" | "settings">(
    "users",
  );
  const [userQuery, setUserQuery] = useState("");
  const [tenantName, setTenantName] = useState<string>("");
  const [orgBio, setOrgBio] = useState<string>("");

  const [orgNameInput, setOrgNameInput] = useState("");
  const [orgBioInput, setOrgBioInput] = useState("");

  // Modal and User Creation states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"OPERATOR" | "VIEWER">("VIEWER");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("pulseguard_user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user?.tenant?.name) {
            setTenantName(user.tenant.name);
            setOrgNameInput(user.tenant.name);
          }
          if (user?.tenant?.bio) {
            setOrgBio(user.tenant.bio);
            setOrgBioInput(user.tenant.bio);
          }
          if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
            toast.error("Access denied. Admin privileges required.");
            window.location.href = "/";
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Live queries
  const { data: dbUsers = [], isLoading: isLoadingUsers } = useAdminUsers();
  const { data: dbAuditLogs = [], isLoading: isLoadingAudit } = useAdminAuditLogs();
  const { mutate: updateRole } = useUpdateUserRole();
  const { mutate: createUser, isPending: isCreatingUser } = useCreateTenantUser();
  const { mutate: updateTenantSettings, isPending: isUpdatingTenant } = useUpdateTenantSettings();

  const handleUpdateTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTenantSettings(
      { name: orgNameInput, bio: orgBioInput },
      {
        onSuccess: () => {
          toast.success("Organization settings updated successfully.");
          setTenantName(orgNameInput);
          setOrgBio(orgBioInput);
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to update settings.");
        },
      }
    );
  };

  // Search filter for user directory with safe optional chaining
  const filteredUsers = dbUsers.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(userQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(userQuery.toLowerCase()),
  );

  const handleRoleChange = (id: string, newRole: string) => {
    updateRole(
      { userId: id, role: newRole },
      {
        onSuccess: () => {
          toast.success("User role updated successfully.");
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to update user role.");
        },
      }
    );
  };

  const handleToggleUserStatus = (id: string) => {
    toast.error("Account locking is not implemented in the current backend version.");
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser(
      {
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      },
      {
        onSuccess: () => {
          toast.success("User created successfully!");
          setIsCreateModalOpen(false);
          setNewUserName("");
          setNewUserEmail("");
          setNewUserPassword("");
          setNewUserRole("VIEWER");
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to create user.");
        },
      }
    );
  };

  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden font-sans select-none">
      {/* 🚀 Left Floating Admin Sidebar */}
      <nav className="flex flex-col items-center py-4 bg-card border-r border-border/40 w-20 transition-all duration-300">
        <div className="flex flex-col items-center py-4 mb-8 border-b border-border/30 w-full">
          <span className="font-mono text-xs font-black text-primary border border-primary px-1.5 py-0.5 rounded-lg bg-primary/5 uppercase tracking-wider">
            ADM
          </span>
        </div>

        <div className="flex flex-col w-full space-y-4 grow">
          {/* Users Navigation Button */}
          <button
            onClick={() => setActiveTab("users")}
            className={`flex flex-col items-center justify-center w-full py-3 relative overflow-hidden transition-all cursor-pointer ${
              activeTab === "users"
                ? "bg-primary/10 text-primary border-l-4 border-primary"
                : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Users className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">
              Users
            </span>
          </button>

          {/* Audit Trail Navigation Button */}
          <button
            onClick={() => setActiveTab("audit")}
            className={`flex flex-col items-center justify-center w-full py-3 relative overflow-hidden transition-all cursor-pointer ${
              activeTab === "audit"
                ? "bg-primary/10 text-primary border-l-4 border-primary"
                : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <ShieldAlert className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">
              Audit
            </span>
          </button>

          {/* Overview Stats Navigation Button */}
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex flex-col items-center justify-center w-full py-3 relative overflow-hidden transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-primary/10 text-primary border-l-4 border-primary"
                : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <BarChart3 className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">
              System
            </span>
          </button>

          {/* Workspace Settings Navigation Button */}
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex flex-col items-center justify-center w-full py-3 relative overflow-hidden transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-primary/10 text-primary border-l-4 border-primary"
                : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Settings className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">
              Settings
            </span>
          </button>
        </div>

        <button
          onClick={() => window.location.href = "/"}
          className="mt-auto p-3 text-muted-foreground/50 hover:text-primary hover:bg-primary/10 rounded-xl transition-all cursor-pointer"
          title="BACK_TO_DASHBOARD"
        >
          <Power className="h-5 w-5" />
        </button>
      </nav>

      {/* Main Content Workspace Frame */}
      <div className="grow flex flex-col h-screen relative bg-muted/20">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-border/40 bg-card/60 backdrop-blur-md px-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xs font-bold font-mono tracking-wider uppercase text-foreground">
              PulseGuard Admin HQ {tenantName ? `| ${tenantName}` : ""}
            </h1>
            <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wide">
              Security Domain
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[9px] font-semibold tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
              Secure Environment
            </div>
          </div>
        </header>

        {/* Scrollable Work View */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {/* TAB 1: USER MANAGEMENT DIRECTORY */}
          {activeTab === "users" && (
            <div className="space-y-5 bg-card border border-border/50 rounded-xl p-5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                <div>
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="h-4.5 w-4.5 text-primary" />
                    User Directory
                  </h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Modify account authentication scopes, global operational
                    permission models, or lock/unlock memberships.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
                    <Input
                      type="text"
                      placeholder="Search name or email..."
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      className="pl-8 text-[11px] h-8 bg-card border-border"
                    />
                  </div>
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-8 text-[11px] font-bold px-3 shrink-0 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add User
                  </Button>
                </div>
              </div>

              <div className="border border-border/40 rounded-lg overflow-hidden">
                {isLoadingUsers ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 bg-card">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Loading system directory...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 bg-card text-center">
                    <Users className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-xs font-semibold text-foreground">No accounts found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="hover:bg-transparent border-b border-border/40">
                        <TableHead className="text-[10px] uppercase font-mono tracking-wider h-9">
                          User Account
                        </TableHead>
                        <TableHead className="text-[10px] uppercase font-mono tracking-wider h-9">
                          Role Scope
                        </TableHead>
                        <TableHead className="text-[10px] uppercase font-mono tracking-wider h-9">
                          Registration Date
                        </TableHead>
                        <TableHead className="text-[10px] uppercase font-mono tracking-wider h-9">
                          Last Login
                        </TableHead>
                        <TableHead className="text-[10px] uppercase font-mono tracking-wider h-9 text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => (
                        <TableRow
                          key={u.id}
                          className="border-b border-border/30 hover:bg-muted/10 transition-colors"
                        >
                          <TableCell className="py-2.5">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-foreground">
                                {u.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground/75 font-mono mt-0.5">
                                {u.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <select
                              value={u.role}
                              onChange={(e) =>
                                handleRoleChange(u.id, e.target.value)
                              }
                              className="bg-muted border border-border/50 rounded-md text-[10px] px-2 py-1 focus:outline-none focus:border-primary font-sans"
                            >
                              <option value="VIEWER">VIEWER</option>
                              <option value="OPERATOR">OPERATOR</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </TableCell>
                          <TableCell className="py-2.5 text-[10px] text-muted-foreground font-mono">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="py-2.5 text-[10px] text-muted-foreground font-mono">
                            {u.lastLoginAt
                              ? new Date(u.lastLoginAt).toLocaleString()
                              : "Never"}
                          </TableCell>
                          <TableCell className="py-2.5 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleUserStatus(u.id)}
                              className={`text-[9px] h-6 px-2.5 font-semibold cursor-pointer ${
                                u.isActive
                                  ? "bg-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/15"
                                  : "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15"
                              }`}
                            >
                              {u.isActive ? "Block Account" : "Activate"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AUDIT LOGS SECURITY TIMELINE */}
          {activeTab === "audit" && (
            <div className="space-y-5 bg-card border border-border/50 rounded-xl p-5 shadow-2xs">
              <div className="border-b border-border/40 pb-4">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ShieldAlert className="h-4.5 w-4.5 text-primary" />
                  Security Audit Trail
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Immutable record of operations performed across cluster nodes
                  by authorized operators.
                </p>
              </div>

              <div className="space-y-3">
                {isLoadingAudit ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 bg-card border border-border/40 rounded-xl">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Loading audit records...</p>
                  </div>
                ) : dbAuditLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 bg-card border border-border/40 rounded-xl text-center">
                    <ShieldCheck className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-xs font-semibold text-foreground">No operations recorded yet</p>
                  </div>
                ) : (
                  dbAuditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-col border border-border/40 rounded-xl bg-card/60 p-4 shadow-3xs"
                    >
                      {/* Log Card Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/20 pb-2.5 mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Shield className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-foreground font-black bg-muted px-2 py-0.5 rounded-md uppercase">
                                {log.action}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                by
                              </span>
                              <span className="text-xs font-bold text-foreground">
                                {log.userEmail}
                              </span>
                            </div>
                            <p className="text-[9px] text-muted-foreground/60 mt-0.5 font-mono">
                              Resource: {log.resource} ({log.resourceId})
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground/70 font-mono">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                          <span className="hidden sm:inline bg-muted/40 px-2 py-0.5 rounded">
                            IP: {log.ipAddress || "Unknown"}
                          </span>
                        </div>
                      </div>

                      {/* Metadata Context Breakdown */}
                      <div className="bg-muted/40 rounded-lg p-2.5 border border-border/20">
                        <div className="flex items-start gap-1.5">
                          <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                              Execution Payload Metadata
                            </span>
                            <pre className="text-[10px] font-mono text-muted-foreground leading-normal whitespace-pre-wrap">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM METRICS OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Quick stats grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border border-border/50 rounded-xl p-5 shadow-2xs flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
                      Active Registrants
                    </span>
                    <h3 className="text-2xl font-black text-foreground mt-0.5">
                      4
                    </h3>
                  </div>
                </div>

                <div className="bg-card border border-border/50 rounded-xl p-5 shadow-2xs flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
                      Total Probe Rules
                    </span>
                    <h3 className="text-2xl font-black text-foreground mt-0.5">
                      14
                    </h3>
                  </div>
                </div>

                <div className="bg-card border border-border/50 rounded-xl p-5 shadow-2xs flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                    <ShieldAlert className="h-5 w-5 text-rose-500 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
                      Global Outages
                    </span>
                    <h3 className="text-2xl font-black text-rose-500 mt-0.5">
                      0
                    </h3>
                  </div>
                </div>
              </div>

              {/* Status information panel */}
              <div className="bg-card border border-border/50 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="border-b border-border/40 pb-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <BarChart3 className="h-4.5 w-4.5 text-primary" />
                    Security Compliance Audit Score
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Live system compliance metrics evaluated against operational
                    configurations.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Metric bar */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-foreground">
                        <span>Database Encryption coverage</span>
                        <span className="font-bold text-emerald-500">100%</span>
                      </div>
                      <div className="h-2 bg-black/15 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-foreground">
                        <span>API Rate Limit headroom</span>
                        <span className="font-bold text-emerald-500">82%</span>
                      </div>
                      <div className="h-2 bg-black/15 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: "82%" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Metric bar */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-foreground">
                        <span>Probing Client Timeout Slack</span>
                        <span className="font-bold text-amber-500">65%</span>
                      </div>
                      <div className="h-2 bg-black/15 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{ width: "65%" }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-foreground">
                        <span>Incident Auto-healing Rate</span>
                        <span className="font-bold text-emerald-500">94%</span>
                      </div>
                      <div className="h-2 bg-black/15 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: "94%" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WORKSPACE SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-5 bg-card border border-border/50 rounded-xl p-5 shadow-2xs">
              <div className="border-b border-border/40 pb-4">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Settings className="h-4.5 w-4.5 text-primary" />
                  Organization Settings
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Update corporate parameters, tenant identifiers, and organization metadata.
                </p>
              </div>

              <form onSubmit={handleUpdateTenantSubmit} className="space-y-5 max-w-xl text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Organization Name</label>
                  <Input
                    type="text"
                    required
                    placeholder="Acme Corporation"
                    value={orgNameInput}
                    onChange={(e) => setOrgNameInput(e.target.value)}
                    className="h-8 bg-muted/20 border-border text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Organization Description / Bio</label>
                  <textarea
                    placeholder="Describe your corporate goals or monitor environments..."
                    rows={4}
                    value={orgBioInput}
                    onChange={(e) => setOrgBioInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-xs focus:outline-none focus:border-primary text-foreground font-sans resize-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isUpdatingTenant}
                    className="h-8 text-[11px] font-bold cursor-pointer"
                  >
                    {isUpdatingTenant ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Settings"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* 🚀 Create User Modal Overlay */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-xl p-5 shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-primary" />
                Create Tenant User
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Register a new operator or viewer linked directly to your organization.
              </p>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Full Name</label>
                <Input
                  type="text"
                  placeholder="Jane Doe"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="h-8 bg-muted/20 border-border text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Email Address</label>
                <Input
                  type="email"
                  placeholder="jane.doe@company.com"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="h-8 bg-muted/20 border-border text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Password</label>
                <Input
                  type="password"
                  placeholder="Minimum 6 characters"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="h-8 bg-muted/20 border-border text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Role Scope</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full h-8 px-2.5 rounded-lg border border-border bg-muted/20 text-xs focus:outline-none focus:border-primary text-foreground cursor-pointer"
                >
                  <option value="VIEWER" className="bg-card">VIEWER (Read-Only access)</option>
                  <option value="OPERATOR" className="bg-card">OPERATOR (Incident resolution & updates)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="h-8 text-[11px] font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatingUser}
                  className="h-8 text-[11px] font-bold cursor-pointer"
                >
                  {isCreatingUser ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Register Account"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
