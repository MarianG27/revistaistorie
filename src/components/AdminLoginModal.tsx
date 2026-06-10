import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { adminLogin } from "@/lib/admin.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AdminLoginModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const login = useServerFn(adminLogin);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ data: { username: username.trim(), password: password.trim() } });
      if (res.ok) {
        toast.success("Bun venit, profesore!");
        onOpenChange(false);
        navigate({ to: "/admin" });
      } else {
        toast.error(res.error ?? "Eroare");
      }
    } catch (err: any) {
      toast.error("Eroare: " + (err?.message ?? "necunoscută"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="paper-card">
        <DialogHeader>
          <DialogTitle className="display text-2xl">Acces redacție</DialogTitle>
          <DialogDescription>Doar editorul revistei poate intra aici.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="u">Utilizator</Label>
            <Input id="u" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p">Parolă</Label>
            <Input id="p" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={loading} className="w-full">{loading ? "Se verifică..." : "Intră"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
