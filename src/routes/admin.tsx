import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminMe, adminLogout,
  listArticles, createArticle, updateArticle, deleteArticle,
  listProjects, createProject, deleteProject,
  uploadFile,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trash2, Pencil, Plus, LogOut, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Revista de Istorie" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function AdminPage() {
  const navigate = useNavigate();
  const me = useServerFn(adminMe);
  const logout = useServerFn(adminLogout);
  const [checking, setChecking] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    me().then((r) => { setOk(r.loggedIn); setChecking(false); if (!r.loggedIn) navigate({ to: "/" }); });
  }, []);

  if (checking) return <div className="p-10 text-center text-muted-foreground">Se verifică sesiunea…</div>;
  if (!ok) return null;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <div className="vintage-divider text-[10px]">REDACȚIE</div>
            <h1 className="display text-2xl">Panou admin</h1>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/"><ArrowLeft className="h-4 w-4 mr-1" />Site</Link></Button>
            <Button size="sm" variant="destructive" onClick={async () => { await logout(); navigate({ to: "/" }); }}>
              <LogOut className="h-4 w-4 mr-1" /> Ieșire
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Tabs defaultValue="articles">
          <TabsList>
            <TabsTrigger value="articles">Articole</TabsTrigger>
            <TabsTrigger value="projects">Proiecte elevi</TabsTrigger>
          </TabsList>
          <TabsContent value="articles" className="mt-6"><ArticlesAdmin /></TabsContent>
          <TabsContent value="projects" className="mt-6"><ProjectsAdmin /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ArticlesAdmin() {
  const qc = useQueryClient();
  const { data: articles = [] } = useQuery({ queryKey: ["articles"], queryFn: () => listArticles() });
  const create = useServerFn(createArticle);
  const update = useServerFn(updateArticle);
  const del = useServerFn(deleteArticle);
  const upload = useServerFn(uploadFile);

  const empty = { id: "", title: "", category: "General", excerpt: "", content: "", image_path: "" };
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(false);

  function startEdit(a: any) {
    setEditing(true);
    setForm({ id: a.id, title: a.title, category: a.category, excerpt: a.excerpt ?? "", content: a.content, image_path: "" });
  }

  async function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const base64 = await fileToBase64(f);
    const res = await upload({ data: { filename: f.name, contentBase64: base64, contentType: f.type } });
    setForm((s) => ({ ...s, image_path: res.path }));
    toast.success("Imagine încărcată");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        title: form.title, category: form.category, excerpt: form.excerpt || null,
        content: form.content, image_path: form.image_path || null,
      };
      if (editing) await update({ data: { ...payload, id: form.id } });
      else await create({ data: payload });
      toast.success(editing ? "Articol actualizat" : "Articol publicat");
      setForm(empty); setEditing(false);
      qc.invalidateQueries({ queryKey: ["articles"] });
    } catch (err: any) { toast.error(err.message ?? "Eroare"); }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <form onSubmit={submit} className="paper-card p-5 space-y-4 h-fit">
        <h3 className="display text-xl">{editing ? "Editează articol" : "Articol nou"}</h3>
        <div className="space-y-2"><Label>Titlu</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
        <div className="space-y-2"><Label>Categorie</Label>
          <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required /></div>
        <div className="space-y-2"><Label>Rezumat scurt</Label>
          <Textarea rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></div>
        <div className="space-y-2"><Label>Conținut</Label>
          <Textarea rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required /></div>
        <div className="space-y-2"><Label>Imagine (opțional)</Label>
          <Input type="file" accept="image/*" onChange={onImage} />
          {form.image_path && <div className="text-xs text-muted-foreground">Încărcată: {form.image_path}</div>}</div>
        <div className="flex gap-2">
          <Button type="submit">{editing ? "Salvează" : <><Plus className="h-4 w-4 mr-1" />Publică</>}</Button>
          {editing && <Button type="button" variant="outline" onClick={() => { setForm(empty); setEditing(false); }}>Anulează</Button>}
        </div>
      </form>

      <div className="space-y-3">
        <h3 className="display text-xl">Articole publicate ({articles.length})</h3>
        {articles.map((a) => (
          <div key={a.id} className="paper-card p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-accent">{a.category}</div>
              <div className="display text-lg leading-tight">{a.title}</div>
              {a.excerpt && <div className="text-xs text-muted-foreground line-clamp-2">{a.excerpt}</div>}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="icon" variant="ghost" onClick={() => startEdit(a)}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={async () => {
                if (!confirm("Ștergi acest articol?")) return;
                await del({ data: { id: a.id } });
                toast.success("Șters"); qc.invalidateQueries({ queryKey: ["articles"] });
              }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectsAdmin() {
  const qc = useQueryClient();
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => listProjects() });
  const create = useServerFn(createProject);
  const del = useServerFn(deleteProject);
  const upload = useServerFn(uploadFile);

  const empty = { title: "", student_name: "", description: "", file_path: "", file_name: "" };
  const [form, setForm] = useState(empty);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const base64 = await fileToBase64(f);
    const res = await upload({ data: { filename: f.name, contentBase64: base64, contentType: f.type || "application/octet-stream" } });
    setForm((s) => ({ ...s, file_path: res.path, file_name: f.name }));
    toast.success("Document încărcat");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create({ data: {
        title: form.title,
        student_name: form.student_name || null,
        description: form.description || null,
        file_path: form.file_path || null,
        file_name: form.file_name || null,
      }});
      toast.success("Proiect adăugat"); setForm(empty);
      qc.invalidateQueries({ queryKey: ["projects"] });
    } catch (err: any) { toast.error(err.message ?? "Eroare"); }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <form onSubmit={submit} className="paper-card p-5 space-y-4 h-fit">
        <h3 className="display text-xl">Proiect nou</h3>
        <div className="space-y-2"><Label>Titlu proiect</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
        <div className="space-y-2"><Label>Nume elev</Label>
          <Input value={form.student_name} onChange={(e) => setForm({ ...form, student_name: e.target.value })} /></div>
        <div className="space-y-2"><Label>Descriere</Label>
          <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="space-y-2"><Label>Document (PDF, DOC, imagine etc.)</Label>
          <Input type="file" onChange={onFile} />
          {form.file_name && <div className="text-xs text-muted-foreground">Încărcat: {form.file_name}</div>}</div>
        <Button type="submit"><Plus className="h-4 w-4 mr-1" />Adaugă proiect</Button>
      </form>

      <div className="space-y-3">
        <h3 className="display text-xl">Proiecte ({projects.length})</h3>
        {projects.map((p) => (
          <div key={p.id} className="paper-card p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="display text-lg leading-tight">{p.title}</div>
              {p.student_name && <div className="text-xs italic text-muted-foreground">— {p.student_name}</div>}
              {p.description && <div className="text-xs text-foreground/80 line-clamp-2">{p.description}</div>}
              {p.file_name && <div className="text-xs text-accent mt-1">📎 {p.file_name}</div>}
            </div>
            <Button size="icon" variant="ghost" onClick={async () => {
              if (!confirm("Ștergi acest proiect?")) return;
              await del({ data: { id: p.id } });
              toast.success("Șters"); qc.invalidateQueries({ queryKey: ["projects"] });
            }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
