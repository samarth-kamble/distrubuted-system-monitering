"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  ShieldAlert,
  Clock,
  Search,
  Power,
  Server,
  Activity,
  ShieldCheck,
  AlertCircle,
  Plus
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  useSuperTenants,
  useSuperUsers,
  useSuperAuditLogs,
} from "../hooks/use-super";

export function SuperConsole() {
  const [activeTab, setActiveTab] = useState<"tenants" | "users" | "audit">("tenants");
  const [searchQuery, setSearchQuery] = useState("");

  const [currentUserRole, setCurrentUserRole] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("pulseguard_user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setCurrentUserRole(user?.role || "");
          if (user?.role !== "SUPER_ADMIN") {
            toast.error("Access Denied: Platform Super Admin role required.");
            window.location.href = "/";
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Super Queries
  const { data: tenants = [], isLoading: isLoadingTenants } = useSuperTenants();
  const { data: users = [], isLoading: isLoadingUsers } = useSuperUsers();
  const { data: auditLogs = [], isLoading: isLoadingAudit } = useSuperAuditLogs();

  const filteredTenants = tenants.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.tenant?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.user?.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.tenant?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination states
  const [tenantsPage, setTenantsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const itemsPerPage = 8;

  // Reset page when filter changes
  useEffect(() => {
    setTenantsPage(1);
    setUsersPage(1);
    setLogsPage(1);
  }, [searchQuery, activeTab]);

  const paginatedTenants = filteredTenants.slice(
    (tenantsPage - 1) * itemsPerPage,
    tenantsPage * itemsPerPage
  );
  const tenantsTotalPages = Math.ceil(filteredTenants.length / itemsPerPage);

  const paginatedUsers = filteredUsers.slice(
    (usersPage - 1) * itemsPerPage,
    usersPage * itemsPerPage
  );
  const usersTotalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginatedLogs = filteredLogs.slice(
    (logsPage - 1) * itemsPerPage,
    logsPage * itemsPerPage
  );
  const logsTotalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  if (currentUserRole !== "SUPER_ADMIN") {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden font-sans select-none">
      {/* Sidebar navigation */}
      <nav className="flex flex-col items-center py-4 bg-card border-r border-border/40 w-20 transition-all duration-300">
        <div className="flex flex-col items-center py-4 mb-8 border-b border-border/30 w-full">
          <span className="font-mono text-[10px] font-black text-rose-500 border border-rose-500/20 px-1.5 py-0.5 rounded-lg bg-rose-500/5 uppercase tracking-wider">
            SUPER
          </span>
        </div>

        <div className="flex flex-col w-full space-y-4 grow">
          <button
            onClick={() => {
              setActiveTab("tenants");
              setSearchQuery("");
            }}
            className={`flex flex-col items-center justify-center w-full py-3 transition-all cursor-pointer ${
              activeTab === "tenants"
                ? "bg-primary/10 text-primary border-l-4 border-primary"
                : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Building2 className="h-4.5 w-4.5 mb-1" />
            <span className="font-mono text-[9px] uppercase tracking-tighter">
              Tenants
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("users");
              setSearchQuery("");
            }}
            className={`flex flex-col items-center justify-center w-full py-3 transition-all cursor-pointer ${
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

          <button
            onClick={() => {
              setActiveTab("audit");
              setSearchQuery("");
            }}
            className={`flex flex-col items-center justify-center w-full py-3 transition-all cursor-pointer ${
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
        </div>

        <button
          onClick={() => window.location.href = "/"}
          className="mt-auto p-3 text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
          title="EXIT_CONSOLE"
        >
          <Power className="h-5 w-5" />
        </button>
      </nav>

      {/* Main content frame */}
      <div className="grow flex flex-col h-screen relative bg-muted/20">
        <header className="h-14 border-b border-border/40 bg-card/60 backdrop-blur-md px-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xs font-bold font-mono tracking-wider uppercase text-foreground">
              PulseGuard Platform HQ
            </h1>
            <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wide">
              Global Platform Scope
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full text-[9px] font-semibold tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_6px_#f43f5e]" />
              Super Admin Mode
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl w-full mx-auto">
            {/* Search bar row */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
                <Input
                  type="text"
                  placeholder={
                    activeTab === "tenants"
                      ? "Search organization names..."
                      : activeTab === "users"
                      ? "Search users and organizations..."
                      : "Search global actions or resources..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-[11px] h-8 bg-card border-border"
                />
              </div>
            </div>

            {/* Tenants Tab */}
            {activeTab === "tenants" && (
              <div className="space-y-4 bg-card border border-border/50 rounded-xl p-5 shadow-2xs">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Registered Tenants</h2>
                  <p className="text-[11px] text-muted-foreground">List of all active SaaS organization contexts configured on this platform.</p>
                </div>

                <div className="border border-border/40 rounded-lg overflow-hidden">
                  {isLoadingTenants ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 bg-card">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <p className="text-xs text-muted-foreground text-center">Loading tenants list...</p>
                    </div>
                  ) : filteredTenants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-card text-center gap-2">
                      <Building2 className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-xs text-muted-foreground font-semibold">No tenants found</p>
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader className="bg-muted/40 font-mono text-[9px] uppercase">
                          <TableRow>
                            <TableHead>Tenant ID</TableHead>
                            <TableHead>Organization Name</TableHead>
                            <TableHead className="text-center">Users Count</TableHead>
                            <TableHead className="text-center">Monitored Services</TableHead>
                            <TableHead className="text-center">Audit Logs Size</TableHead>
                            <TableHead className="text-right">Created At</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-[11px]">
                          {paginatedTenants.map((tenant) => (
                            <TableRow key={tenant.id} className="hover:bg-muted/30">
                              <TableCell className="font-mono text-[10px] text-muted-foreground/80">{tenant.id}</TableCell>
                              <TableCell className="font-semibold text-foreground">{tenant.name}</TableCell>
                              <TableCell className="text-center font-mono font-medium">{tenant._count.users}</TableCell>
                              <TableCell className="text-center font-mono font-medium text-primary">{tenant._count.services}</TableCell>
                              <TableCell className="text-center font-mono font-medium text-muted-foreground">{tenant._count.auditLogs}</TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {new Date(tenant.createdAt).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Pagination Controls */}
                      {tenantsTotalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-border/40 bg-card/30">
                          <span className="text-[11px] text-muted-foreground font-mono">
                            Showing {((tenantsPage - 1) * itemsPerPage) + 1} to {Math.min(tenantsPage * itemsPerPage, filteredTenants.length)} of {filteredTenants.length} tenants
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTenantsPage(prev => Math.max(prev - 1, 1))}
                              disabled={tenantsPage === 1}
                              className="h-7 text-[10px] px-2.5 font-bold cursor-pointer"
                            >
                              Previous
                            </Button>
                            <div className="text-[10px] font-mono font-bold bg-muted px-2.5 py-1 rounded-md border border-border/40">
                              Page {tenantsPage} of {tenantsTotalPages}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTenantsPage(prev => Math.min(prev + 1, tenantsTotalPages))}
                              disabled={tenantsPage === tenantsTotalPages}
                              className="h-7 text-[10px] px-2.5 font-bold cursor-pointer"
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="space-y-4 bg-card border border-border/50 rounded-xl p-5 shadow-2xs">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Global User Directory</h2>
                  <p className="text-[11px] text-muted-foreground">Comprehensive directory of all user profiles registered across SaaS organizations.</p>
                </div>

                <div className="border border-border/40 rounded-lg overflow-hidden">
                  {isLoadingUsers ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 bg-card">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <p className="text-xs text-muted-foreground text-center">Loading users...</p>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-card text-center gap-2">
                      <Users className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-xs text-muted-foreground font-semibold">No users found</p>
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader className="bg-muted/40 font-mono text-[9px] uppercase">
                          <TableRow>
                            <TableHead>User ID</TableHead>
                            <TableHead>User Details</TableHead>
                            <TableHead>Organization Scope</TableHead>
                            <TableHead>Platform Role</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Last Login</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-[11px]">
                          {paginatedUsers.map((user) => (
                            <TableRow key={user.id} className="hover:bg-muted/30">
                              <TableCell className="font-mono text-[10px] text-muted-foreground/80">{user.id}</TableCell>
                              <TableCell>
                                <div className="font-semibold text-foreground">{user.name}</div>
                                <div className="text-[10px] text-muted-foreground">{user.email}</div>
                              </TableCell>
                              <TableCell>
                                {user.tenant ? (
                                  <div className="flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="font-medium text-foreground">{user.tenant.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground/60 italic">No Tenant Scope</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  user.role === "SUPER_ADMIN"
                                    ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                    : user.role === "ADMIN"
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "bg-muted text-muted-foreground border border-border"
                                }`}>
                                  {user.role}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`h-2 w-2 rounded-full inline-block ${user.isActive ? "bg-emerald-500" : "bg-muted"}`} />
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground font-mono text-[10px]">
                                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Pagination Controls */}
                      {usersTotalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-border/40 bg-card/30">
                          <span className="text-[11px] text-muted-foreground font-mono">
                            Showing {((usersPage - 1) * itemsPerPage) + 1} to {Math.min(usersPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUsersPage(prev => Math.max(prev - 1, 1))}
                              disabled={usersPage === 1}
                              className="h-7 text-[10px] px-2.5 font-bold cursor-pointer"
                            >
                              Previous
                            </Button>
                            <div className="text-[10px] font-mono font-bold bg-muted px-2.5 py-1 rounded-md border border-border/40">
                              Page {usersPage} of {usersTotalPages}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUsersPage(prev => Math.min(prev + 1, usersTotalPages))}
                              disabled={usersPage === usersTotalPages}
                              className="h-7 text-[10px] px-2.5 font-bold cursor-pointer"
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Audit Logs Tab */}
            {activeTab === "audit" && (
              <div className="space-y-4 bg-card border border-border/50 rounded-xl p-5 shadow-2xs">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Global Platform Audit Trail</h2>
                  <p className="text-[11px] text-muted-foreground">Historical ledger of all security, authentication, and state operations across the platform.</p>
                </div>

                <div className="border border-border/40 rounded-lg overflow-hidden">
                  {isLoadingAudit ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 bg-card">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <p className="text-xs text-muted-foreground text-center">Loading audit trails...</p>
                    </div>
                  ) : filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-card text-center gap-2">
                      <ShieldCheck className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-xs text-muted-foreground font-semibold">No platform audit logs recorded yet</p>
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader className="bg-muted/40 font-mono text-[9px] uppercase">
                          <TableRow>
                            <TableHead>Audit Log ID</TableHead>
                            <TableHead>Operator Identity</TableHead>
                            <TableHead>Organization Scope</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Resource ID / Type</TableHead>
                            <TableHead className="text-right">Timestamp</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-[11px]">
                          {paginatedLogs.map((log) => (
                            <TableRow key={log.id} className="hover:bg-muted/30">
                              <TableCell className="font-mono text-[10px] text-muted-foreground/80">{log.id.slice(0, 8)}...</TableCell>
                              <TableCell>
                                <span className="font-semibold text-foreground">{log.user?.email || "System Processor"}</span>
                              </TableCell>
                              <TableCell>
                                {log.tenant ? (
                                  <div className="flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="font-medium text-foreground">{log.tenant.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground/50">Global</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px] text-foreground">
                                  {log.action}
                                </span>
                              </TableCell>
                              <TableCell className="font-mono text-muted-foreground text-[10px]">{log.resource}</TableCell>
                              <TableCell className="text-right text-muted-foreground font-mono text-[10px]">
                                {new Date(log.createdAt).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Pagination Controls */}
                      {logsTotalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-border/40 bg-card/30">
                          <span className="text-[11px] text-muted-foreground font-mono">
                            Showing {((logsPage - 1) * itemsPerPage) + 1} to {Math.min(logsPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} logs
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLogsPage(prev => Math.max(prev - 1, 1))}
                              disabled={logsPage === 1}
                              className="h-7 text-[10px] px-2.5 font-bold cursor-pointer"
                            >
                              Previous
                            </Button>
                            <div className="text-[10px] font-mono font-bold bg-muted px-2.5 py-1 rounded-md border border-border/40">
                              Page {logsPage} of {logsTotalPages}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLogsPage(prev => Math.min(prev + 1, logsTotalPages))}
                              disabled={logsPage === logsTotalPages}
                              className="h-7 text-[10px] px-2.5 font-bold cursor-pointer"
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
