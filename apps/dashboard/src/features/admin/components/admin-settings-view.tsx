"use client";

import { useState, useEffect } from "react";
import { Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateTenantSettings } from "../hooks/use-admin";
import { toast } from "sonner";

export function AdminSettingsView() {
  const [orgNameInput, setOrgNameInput] = useState("");
  const [orgBioInput, setOrgBioInput] = useState("");

  const { mutate: updateTenantSettings, isPending: isUpdatingTenant } = useUpdateTenantSettings();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("pulseguard_user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user?.tenant?.name) {
            setOrgNameInput(user.tenant.name);
          }
          if (user?.tenant?.bio) {
            setOrgBioInput(user.tenant.bio);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const handleUpdateTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTenantSettings(
      { name: orgNameInput, bio: orgBioInput },
      {
        onSuccess: () => {
          toast.success("Organization settings updated successfully.");
          // Update localStorage
          const userStr = localStorage.getItem("pulseguard_user");
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              if (user.tenant) {
                user.tenant.name = orgNameInput;
                user.tenant.bio = orgBioInput;
                localStorage.setItem("pulseguard_user", JSON.stringify(user));
              }
            } catch (e) {
              console.error(e);
            }
          }
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to update settings.");
        },
      }
    );
  };

  return (
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
  );
}
