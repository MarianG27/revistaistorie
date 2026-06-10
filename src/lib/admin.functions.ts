import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";

type AdminSession = { loggedIn?: boolean; username?: string };

async function requireAdmin() {
  const { getSessionPassword } = await import("./admin.server");
  const session = await useSession<AdminSession>({
    password: getSessionPassword(),
    name: "rdi_admin",
    maxAge: 60 * 60 * 8,
    cookie: { httpOnly: true, secure: true, sameSite: "lax", path: "/" },
  });
  if (!session.data?.loggedIn) {
    throw new Error("Neautorizat");
  }
  return session;
}

// -------- AUTH --------

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; password: string }) =>
    z.object({ username: z.string().min(1).max(100), password: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { verifyPassword, getSessionPassword } = await import("./admin.server");

    const { data: row, error } = await supabaseAdmin
      .from("admin_credentials")
      .select("username, password_hash, salt")
      .eq("id", 1)
      .single();

    if (error || !row) return { ok: false as const, error: "Configurare lipsă" };
    if (row.username !== data.username) return { ok: false as const, error: "Utilizator sau parolă greșite" };
    if (!verifyPassword(data.password, row.salt, row.password_hash)) {
      return { ok: false as const, error: "Utilizator sau parolă greșite" };
    }

    const session = await useSession<AdminSession>({
      password: getSessionPassword(),
      name: "rdi_admin",
      maxAge: 60 * 60 * 8,
      cookie: { httpOnly: true, secure: true, sameSite: "lax", path: "/" },
    });
    await session.update({ loggedIn: true, username: row.username });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { getSessionPassword } = await import("./admin.server");
  const session = await useSession<AdminSession>({
    password: getSessionPassword(),
    name: "rdi_admin",
    maxAge: 60 * 60 * 8,
    cookie: { httpOnly: true, secure: true, sameSite: "lax", path: "/" },
  });
  await session.clear();
  return { ok: true };
});

export const adminMe = createServerFn({ method: "GET" }).handler(async () => {
  const { getSessionPassword } = await import("./admin.server");
  const session = await useSession<AdminSession>({
    password: getSessionPassword(),
    name: "rdi_admin",
    maxAge: 60 * 60 * 8,
    cookie: { httpOnly: true, secure: true, sameSite: "lax", path: "/" },
  });
  return { loggedIn: !!session.data?.loggedIn, username: session.data?.username ?? null };
});

// -------- ARTICLES (public read) --------

async function signMediaUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage.from("media").createSignedUrl(path, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? null;
}

export const listArticles = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("id, title, category, excerpt, content, image_url, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const withUrls = await Promise.all(
    (data ?? []).map(async (a) => ({ ...a, image_url: await signMediaUrl(a.image_url) })),
  );
  return withUrls;
});

const articleSchema = z.object({
  title: z.string().min(1).max(300),
  category: z.string().min(1).max(80),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(1).max(20000),
  image_path: z.string().max(500).optional().nullable(),
});

export const createArticle = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof articleSchema>) => articleSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("articles").insert({
      title: data.title,
      category: data.category,
      excerpt: data.excerpt ?? null,
      content: data.content,
      image_url: data.image_path ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateArticle = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof articleSchema> & { id: string }) =>
    articleSchema.extend({ id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("articles")
      .update({
        title: data.title,
        category: data.category,
        excerpt: data.excerpt ?? null,
        content: data.content,
        image_url: data.image_path ?? null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteArticle = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- PROJECTS (student work) --------

export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("id, title, student_name, description, file_url, file_name, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const withUrls = await Promise.all(
    (data ?? []).map(async (p) => ({ ...p, file_url: await signMediaUrl(p.file_url) })),
  );
  return withUrls;
});

const projectSchema = z.object({
  title: z.string().min(1).max(300),
  student_name: z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  file_path: z.string().max(500).optional().nullable(),
  file_name: z.string().max(300).optional().nullable(),
});

export const createProject = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof projectSchema>) => projectSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("projects").insert({
      title: data.title,
      student_name: data.student_name ?? null,
      description: data.description ?? null,
      file_url: data.file_path ?? null,
      file_name: data.file_name ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- UPLOAD --------

export const uploadFile = createServerFn({ method: "POST" })
  .inputValidator((d: { filename: string; contentBase64: string; contentType: string }) =>
    z
      .object({
        filename: z.string().min(1).max(200),
        contentBase64: z.string().min(1).max(15_000_000),
        contentType: z.string().min(1).max(120),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
    const buffer = Buffer.from(data.contentBase64, "base64");
    const { error } = await supabaseAdmin.storage.from("media").upload(path, buffer, {
      contentType: data.contentType,
      upsert: false,
    });
    if (error) throw new Error(error.message);
    return { path };
  });
