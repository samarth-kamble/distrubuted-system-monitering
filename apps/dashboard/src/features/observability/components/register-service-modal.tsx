import { FormEvent, Dispatch, SetStateAction } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface RegisterServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (e: FormEvent) => void
  formData: {
    name: string
    targetUrl: string
    method: string
    intervalSeconds: number
    timeoutMs: number
  }
  setFormData: Dispatch<
    SetStateAction<{
      name: string
      targetUrl: string
      method: string
      intervalSeconds: number
      timeoutMs: number
    }>
  >
}

export function RegisterServiceModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
}: RegisterServiceModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-card border border-border/60 rounded-2xl w-full max-w-md overflow-hidden shadow-lg animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-border/40 px-5 py-4 bg-muted/40">
          <h3 className="text-xs font-bold text-foreground">Register New Service Node</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 flex flex-col space-y-4">
          {/* Service Name */}
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="name">Service Name</Label>
            <Input
              id="name"
              type="text"
              required
              placeholder="e.g., Auth Daemon, Stripe Gateway"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="bg-card border-border placeholder-muted-foreground/45"
            />
          </div>

          {/* Target URL */}
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="targetUrl">Target URL Endpoint</Label>
            <Input
              id="targetUrl"
              type="text"
              required
              placeholder="https://api.github.com"
              value={formData.targetUrl}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, targetUrl: e.target.value }))
              }
              className="bg-card border-border font-mono placeholder-muted-foreground/45"
            />
          </div>

          {/* Row: Method & Interval */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="method">HTTP Method</Label>
              <select
                id="method"
                value={formData.method}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, method: e.target.value }))
                }
                className="bg-card border border-border rounded-lg text-sm px-2.5 h-9 focus:outline-none focus:border-primary"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
                <option value="HEAD">HEAD</option>
                <option value="OPTIONS">OPTIONS</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="interval">Interval (seconds)</Label>
              <Input
                id="interval"
                type="number"
                required
                min={10}
                max={86400}
                value={formData.intervalSeconds}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    intervalSeconds: parseInt(e.target.value) || 30,
                  }))
                }
                className="bg-card border-border"
              />
            </div>
          </div>

          {/* Timeout */}
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="timeout">Timeout (milliseconds)</Label>
            <Input
              id="timeout"
              type="number"
              required
              min={500}
              max={30000}
              value={formData.timeoutMs}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  timeoutMs: parseInt(e.target.value) || 5000,
                }))
              }
              className="bg-card border-border font-mono"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="cursor-pointer"
            >
              Register Service
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
