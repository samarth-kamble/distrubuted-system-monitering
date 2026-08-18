"use client";

import { useState, useEffect } from "react";
import { Users, Search, Plus, Loader2 } from "lucide-react";
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
import {
  useAdminUsers,
  useUpdateUserRole,
  useCreateTenantUser,
} from "../hooks/use-admin";
import { toast } from "sonner";

export function AdminUsersView() {
  const [userQuery, setUserQuery] = useState("");
  
  // Modal and User Creation states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"OPERATOR" | "VIEWER">("VIEWER");

  // Hooks
  const { data: dbUsers = [], isLoading: isLoadingUsers } = useAdminUsers();
  const { mutate: updateRole } = useUpdateUserRole();
  const { mutate: createUser, isPending: isCreatingUser } = useCreateTenantUser();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Search filter
  const filteredUsers = dbUsers.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(userQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(userQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [userQuery]);

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
              {paginatedUsers.map((u) => (
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-4">
          <span className="text-[11px] text-muted-foreground font-mono">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="h-7 text-[10px] px-2.5 font-bold cursor-pointer"
            >
              Previous
            </Button>
            <div className="text-[10px] font-mono font-bold bg-muted px-2.5 py-1 rounded-md border border-border/40">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="h-7 text-[10px] px-2.5 font-bold cursor-pointer"
            >
              Next
            </Button>
          </div>
        </div>
      )}

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
