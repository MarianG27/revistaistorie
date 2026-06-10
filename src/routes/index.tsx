import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { Feather, BookOpen, ScrollText, Image as ImageIcon, FileDown, Lock, Menu, X } from "lucide-react";
import { listArticles, listProjects } from "@/lib/admin.functions";
import { AdminLoginModal } from "@/components/AdminLoginModal";

const articlesQuery = queryOptions({ queryKey: ["articles"], queryFn: () => listArticles() });
const projectsQuery = queryOptions({ queryKey: ["projects"], queryFn: () => listProjects() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Revista de Istorie" },
      { name: "description", content: "Articole de istorie, proiecte ale elevilor și galerie vizuală." },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(articlesQuery),
      context.queryClient.ensureQueryData(projectsQuery),
    ]);
  },
  component: HomePage,
});

function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
      <div className="anim-ink display text-5xl text-primary">R · I</div>
      <div className="mt-4 text-[10px] sm:text-sm tracking-[0.3em] sm:tracking-[0.4em] text-muted-foreground">REVISTA DE ISTORIE</div>
      <div className="mt-8 h-px w-40 overflow-hidden bg-border">
        <div className="h-full w-1/3 animate-pulse bg-accent" />
      </div>
    </div>
  );
}

function HomePage() {
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("Toate");
  const [openArticleId, setOpenArticleId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [articlesOpen, setArticlesOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);

  const { data: articles = [] } = useQuery(articlesQuery);
  const { data: projects = [] } = useQuery(projectsQuery);

  const categories = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => set.add(a.category));
    return ["Toate", ...Array.from(set)];
  }, [articles]);

  const filtered = activeCategory === "Toate" ? articles : articles.filter((a) => a.category === activeCategory);
  const openArticle = articles.find((a) => a.id === openArticleId) ?? filtered[0] ?? articles[0];

  if (loading) return <LoadingScreen />;

  const ArticleList = (
    <ul className="space-y-3">
      {filtered.length === 0 && <li className="text-sm text-muted-foreground">Niciun articol.</li>}
      {filtered.map((a) => (
        <li key={a.id}>
          <button
            onClick={() => { setOpenArticleId(a.id); setArticlesOpen(false); }}
            className={`w-full text-left paper-card p-3 transition hover:translate-x-0.5 hover:border-accent ${openArticle?.id === a.id ? "border-accent" : ""}`}
          >
            <div className="text-[10px] uppercase tracking-widest text-accent">{a.category}</div>
            <div className="display text-base sm:text-lg leading-tight">{a.title}</div>
            {a.excerpt && <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{a.excerpt}</div>}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="min-h-screen">
      {/* ZONA 1 — antet + meniu */}
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 text-center">
          <div className="vintage-divider text-[10px] sm:text-xs">EDIȚIA · ȘCOLARĂ</div>
          <h1 className="display text-3xl sm:text-5xl md:text-6xl tracking-tight">Revista de Istorie</h1>
          <p className="mt-1 italic text-xs sm:text-base text-muted-foreground px-2">„Cine nu cunoaște trecutul, este condamnat să-l repete.”</p>
          <div className="gold-rule mt-3 sm:mt-4" />

          {/* Desktop nav */}
          <nav className="mt-4 hidden md:flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm uppercase tracking-widest">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => { setActiveCategory(c); setOpenArticleId(null); }}
                className={`transition-colors ${activeCategory === c ? "text-primary border-b border-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {c}
              </button>
            ))}
          </nav>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden mt-3 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"
            aria-label="Meniu"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            {menuOpen ? "Închide" : "Categorii"}
          </button>
          {menuOpen && (
            <nav className="md:hidden mt-3 flex flex-col gap-2 text-sm uppercase tracking-widest border-t border-border pt-3">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => { setActiveCategory(c); setOpenArticleId(null); setMenuOpen(false); }}
                  className={`py-1 ${activeCategory === c ? "text-primary" : "text-muted-foreground"}`}
                >
                  {c}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 sm:px-4 py-6 sm:py-10">
        {/* Mobile: buton pentru lista de articole */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setArticlesOpen((o) => !o)}
            className="w-full paper-card p-3 flex items-center justify-between"
          >
            <span className="display text-lg flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-accent" /> Articole ({filtered.length})
            </span>
            {articlesOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          {articlesOpen && <div className="mt-3">{ArticleList}</div>}
        </div>

        {/* Grid principal: 3 coloane pe desktop, 1 pe mobil */}
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
          {/* ZONA 21 — listă articole (desktop) */}
          <aside className="hidden lg:block space-y-4">
            <h2 className="display flex items-center gap-2 text-2xl">
              <ScrollText className="h-5 w-5 text-accent" /> Articole
            </h2>
            <div className="gold-rule" />
            {ArticleList}
          </aside>

          {/* ZONA 22 — articolul deschis */}
          <article className="paper-card p-4 sm:p-6 md:p-10 min-w-0">
            {openArticle ? (
              <>
                <div className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-accent">{openArticle.category}</div>
                <h2 className="display mt-2 text-2xl sm:text-3xl md:text-4xl leading-tight">{openArticle.title}</h2>
                <div className="mt-2 text-xs text-muted-foreground">
                  {new Date(openArticle.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
                </div>
                <div className="gold-rule my-4" />
                {openArticle.image_url && (
                  <figure className="my-4">
                    <img src={openArticle.image_url} alt={openArticle.title} className="w-full rounded-sm border border-border object-cover sepia-[0.15]" />
                  </figure>
                )}
                <div className="ink-prose md:columns-2 md:gap-8">
                  {openArticle.content.split("\n").filter(Boolean).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-20">
                <BookOpen className="mx-auto h-10 w-10 opacity-50" />
                <p className="mt-3">Selectează un articol.</p>
              </div>
            )}
          </article>

          {/* ZONA 23 — laterală: proiecte + galerie */}
          <aside className="space-y-8">
            <section>
              <h2 className="display flex items-center gap-2 text-xl">
                <Feather className="h-5 w-5 text-accent" /> Proiectele elevilor
              </h2>
              <div className="gold-rule my-2" />
              <div className="space-y-3">
                {projects.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Niciun proiect încă.</p>
                )}
                {projects.map((p) => (
                  <div key={p.id} className="paper-card p-3">
                    <div className="text-[10px] uppercase tracking-widest text-accent">Proiect</div>
                    <h3 className="display text-base mt-0.5 leading-tight">{p.title}</h3>
                    {p.student_name && <div className="text-[11px] text-muted-foreground italic">— {p.student_name}</div>}
                    {p.description && <p className="mt-1 text-xs text-foreground/80 line-clamp-3">{p.description}</p>}
                    {p.file_url && (
                      <a
                        href={p.file_url}
                        download={p.file_name ?? undefined}
                        className="mt-2 inline-flex items-center gap-1 text-xs quill-link"
                      >
                        <FileDown className="h-3 w-3" /> Descarcă
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="display flex items-center gap-2 text-xl">
                <ImageIcon className="h-5 w-5 text-accent" /> Galerie
              </h2>
              <div className="gold-rule my-2" />
              <div className="grid grid-cols-3 lg:grid-cols-2 gap-2">
                {articles.filter((a) => a.image_url).slice(0, 6).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setOpenArticleId(a.id)}
                    className="aspect-square overflow-hidden rounded-sm border border-border"
                  >
                    <img src={a.image_url!} alt={a.title} className="h-full w-full object-cover sepia-[0.2] hover:sepia-0 transition" />
                  </button>
                ))}
                {articles.filter((a) => a.image_url).length === 0 && (
                  <p className="col-span-full text-xs text-muted-foreground italic">Fără imagini încă.</p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </main>

      {/* ZONA 31 — subsol cu © (acces admin) */}
      <footer className="mt-16 border-t border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-8 flex flex-col items-center gap-3">
          <div className="vintage-divider text-xs">✦ ✦ ✦</div>
          <p className="text-center text-sm text-muted-foreground px-4">
            Revista de Istorie · Realizată cu pasiune pentru trecut
          </p>
          <button
            onClick={() => setLoginOpen(true)}
            title="©"
            aria-label="Acces admin"
            className="group mt-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-accent hover:text-primary"
          >
            <span className="text-base font-serif group-hover:hidden">©</span>
            <Lock className="hidden h-4 w-4 group-hover:block" />
          </button>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} — Toate drepturile rezervate</p>
        </div>
      </footer>

      <AdminLoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
