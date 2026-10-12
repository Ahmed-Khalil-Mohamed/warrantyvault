import React, { useState, useEffect, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  MagnifyingGlass,
  GlobeHemisphereWest,
  Desktop,
  SignOut,
  ArrowClockwise,
  Download,
  Clock,
  Trash,
  FolderOpen,
  ArrowUUpLeft,
  CheckCircle,
  House,
  Stack,
  Lightning,
  ArrowDown,
  Moon,
  Sun,
  PencilSimple,
  UsersThree,
  Wrench,
  BowlFood,
  Briefcase,
  HandHeart,
  ShieldCheck,
  Package,
  Scales,
  Cards,
} from "@phosphor-icons/react";
import "@fontsource-variable/manrope";
import "@fontsource-variable/noto-sans-arabic";
import "./styles.css";
import "./design.css";
import { ProductComposition, ProductRecords } from "./experience";
import { ProductLayout } from "./layout";
import { productCopy, QueueDesk, ProductFocus } from "./product-views";
import { projects, findProject } from "./projects";
import {
  type Project,
  type Lang,
  type Entry,
  type Action,
  type Data,
  cash,
} from "./contracts";
import { balances, settlements } from "./settlements";
import { api, csv, download } from "./api";
import { editFields } from "./editing";
import {
  Modal,
  DataForm,
  ErrorMessage,
  Status,
  RecordSummary,
  Details,
  useCopy,
  fmtDate,
} from "./components";
declare global {
  interface Window {
    desktop?: {
      files: (operation: "preview" | "apply" | "undo") => Promise<any>;
    };
  }
}
type User = {
  id: string;
  name: string;
  email: string;
  demo: boolean;
  desktop: boolean;
};
const projectIcons = {
  queuewise: UsersThree,
  fixlane: Wrench,
  rescuetable: BowlFood,
  scopedesk: Briefcase,
  givetime: HandHeart,
  filenest: FolderOpen,
  warrantyvault: ShieldCheck,
  stockroom: Package,
  fairshare: Scales,
  recall: Cards,
};
function ProjectIcon({ id, size = 24 }: { id: string; size?: number }) {
  const Icon = projectIcons[id as keyof typeof projectIcons] ?? Stack;
  return <Icon size={size} weight="duotone" aria-hidden="true" />;
}
function App() {
  const [lang, setLang] = useState<Lang>(() =>
    localStorage.getItem("language") === "ar" ? "ar" : "en",
  );
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem("theme") ??
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
  );
  const project = findProject(location.pathname.slice(1)) ?? projects[0];
  const t = useCopy(lang),
    copy = productCopy[project.id];
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("language", lang);
  }, [lang]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);
  useEffect(() => {
    document.title = `${project.name} | ${copy.section.en}`;
    if (location.pathname === "/")
      history.replaceState(null, "", "/" + project.id);
    api<User>("/me")
      .then(setUser)
      .catch((e) => {
        if (e.message !== "unauthorized") setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [project, copy]);
  async function demo() {
    setLoading(true);
    setError("");
    try {
      setUser(await api<User>("/auth/demo", "POST", {}));
      setAuth(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  async function logout() {
    try {
      await api("/auth/logout", "POST", {});
      setUser(null);
    } catch (e: any) {
      setError(e.message);
    }
  }
  const brand = (
    <div className="product-brand">
      <span className="product-symbol">
        <img src="/app-icon.svg" alt="" />
      </span>
      <span>
        {project.name}
        <small>{copy.category[lang]}</small>
      </span>
    </div>
  );
  const utilities = (
    <div className="top-actions">
      <button
        className="language-button"
        onClick={() => setLang(lang === "en" ? "ar" : "en")}
      >
        {lang === "en" ? "العربية" : "English"}
      </button>
      <button
        className="icon-button"
        aria-label={
          theme === "light"
            ? t("Use dark theme", "المظهر الداكن")
            : t("Use light theme", "المظهر الفاتح")
        }
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
      </button>
      {user && !user.desktop && (
        <button
          className="icon-button"
          aria-label={t("Sign out", "تسجيل الخروج")}
          onClick={logout}
        >
          <SignOut size={19} />
        </button>
      )}
    </div>
  );
  return (
    <div
      className={`product-root product-${project.id}`}
      style={{ "--accent": project.color } as React.CSSProperties}
    >
      {user ? (
        <ProductLayout brand={brand} utilities={utilities} lang={lang}>
          {error && <ErrorMessage error={error} lang={lang} />}
          <Workspace
            key={project.id + user.id}
            p={project}
            lang={lang}
            user={user}
          />
        </ProductLayout>
      ) : (
        <div className="product-entry">
          <header className="entry-header">
            {brand}
            {utilities}
          </header>
          <main className="entry-main">
            <section className="entry-copy">
              <span className="entry-category">{copy.category[lang]}</span>
              <h1>
                {lang === "ar" ? project.arabic : project.name}
                <span>{copy.section[lang]}</span>
              </h1>
              <p>{project.problem[lang]}</p>
              <div className="hero-actions">
                <button className="primary" onClick={demo} disabled={loading}>
                  {t("Explore with sample data", "جرّب ببيانات تجريبية")}
                  <ArrowRight size={18} />
                </button>
                <button className="secondary" onClick={() => setAuth(true)}>
                  {t("Create your workspace", "أنشئ مساحة عملك")}
                </button>
              </div>
              <div className="entry-notes">
                <span>{t("Arabic & English", "عربي وإنجليزي")}</span>
                <span>
                  {project.kind === "desktop"
                    ? t("Windows · works offline", "Windows · يعمل دون إنترنت")
                    : t("Your own private workspace", "مساحة عمل خاصة بيك")}
                </span>
              </div>
              {error && <ErrorMessage error={error} lang={lang} />}
            </section>
            <div className="entry-preview">
              <img
                src="/preview.png"
                alt={t(
                  `${project.name} workspace preview with fictional sample data`,
                  `معاينة ${project.arabic} ببيانات خيالية`,
                )}
              />
              <span>
                {t(
                  "Workspace preview · sample data",
                  "معاينة مساحة العمل · بيانات تجريبية",
                )}
              </span>
            </div>
          </main>
          <footer className="entry-footer">
            <span>{project.name}</span>
            <span>
              {project.kind === "desktop"
                ? t(
                    "Browser preview. The Windows app stores your workspace locally.",
                    "معاينة المتصفح. تطبيق Windows بيحفظ مساحة العمل على جهازك.",
                  )
                : t(
                    "Manage your work in one place.",
                    "إدارة شغلك في مكان واحد.",
                  )}
            </span>
          </footer>
        </div>
      )}
      {auth && (
        <Auth
          lang={lang}
          close={() => setAuth(false)}
          onUser={(u) => {
            setUser(u);
            setAuth(false);
          }}
          onDemo={demo}
        />
      )}
    </div>
  );
}
function pLabel(p: Project, lang: Lang) {
  return lang === "ar"
    ? p.entity.ar
    : p.entity.en.charAt(0).toUpperCase() + p.entity.en.slice(1);
}
function Auth({
  lang,
  close,
  onUser,
  onDemo,
}: {
  lang: Lang;
  close: () => void;
  onUser: (u: User) => void;
  onDemo: () => void;
}) {
  const [register, setRegister] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const t = useCopy(lang);
  return (
    <Modal
      title={
        register
          ? t("Make room for better work", "مساحة لشغل أفضل")
          : t("Welcome to your workspace", "أهلًا بك في مساحة عملك")
      }
      onClose={close}
    >
      <form
        className="auth-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const input = Object.fromEntries(new FormData(e.currentTarget));
          setBusy(true);
          setError("");
          try {
            onUser(
              await api(
                "/auth/" + (register ? "register" : "login"),
                "POST",
                input,
              ),
            );
          } catch (e: any) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {register && (
          <label>
            {t("Your name", "اسمك")}
            <input name="name" required maxLength={100} autoComplete="name" />
          </label>
        )}
        <label>
          {t("Email", "البريد الإلكتروني")}
          <input
            name="email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
          />
        </label>
        <label>
          {t(
            "Password · at least 12 characters",
            "كلمة المرور · ١٢ حرفًا على الأقل",
          )}
          <input
            name="password"
            type="password"
            minLength={12}
            maxLength={128}
            required
            autoComplete={register ? "new-password" : "current-password"}
          />
        </label>
        {error && <ErrorMessage error={error} lang={lang} />}
        <button className="primary" disabled={busy}>
          {busy
            ? t("Please wait…", "لحظة…")
            : register
              ? t("Create account", "إنشاء حساب")
              : t("Sign in", "دخول")}
        </button>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setRegister(!register);
            setError("");
          }}
        >
          {register
            ? t("Already have an account? Sign in", "عندك حساب؟ سجل دخول")
            : t("New here? Create an account", "أول مرة؟ أنشئ حساب")}
        </button>
        <div className="divider" />
        <button type="button" className="secondary" onClick={onDemo}>
          {t(
            "Explore a separate demo workspace",
            "استكشف مساحة تجريبية منفصلة",
          )}
        </button>
      </form>
    </Modal>
  );
}
function Workspace({ p, lang, user }: { p: Project; lang: Lang; user: User }) {
  const t = useCopy(lang);
  const [rows, setRows] = useState<Entry[]>([]),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [sort, setSort] = useState(p.id === "queuewise" ? "priority" : "newest"),
    [now, setNow] = useState(new Date());
  const [modal, setModal] = useState<
      "create" | "edit" | "history" | "delete" | null
    >(null),
    [selected, setSelected] = useState<string | null>(null),
    [action, setAction] = useState<Action | null>(null),
    [events, setEvents] = useState<any[]>([]),
    [formError, setFormError] = useState("");
  const demoSeeded = useRef(false);
  const saving = useRef(false);
  const selectedEntry = rows.find((e) => e.id === selected);
  const reload = useCallback(async () => {
    const list = await api<Entry[]>(`/${p.id}/entries`);
    setRows(list);
    return list;
  }, [p.id]);
  useEffect(() => {
    let current = true;
    async function initial() {
      try {
        let list = await api<Entry[]>(`/${p.id}/entries`);
        if (user.demo && !list.length && !demoSeeded.current) {
          demoSeeded.current = true;
          list = await api(`/${p.id}/seed`, "POST", {});
        }
        if (current) {
          setRows(list);
          setNow(new Date());
        }
      } catch (e: any) {
        if (current) setError(e.message);
      } finally {
        if (current) setLoading(false);
      }
    }
    initial();
    const timer = setInterval(() => {
      setNow(new Date());
      if (p.id === "queuewise") reload().catch(() => {});
    }, 30000);
    return () => {
      current = false;
      clearInterval(timer);
    };
  }, [p.id, user.demo, reload]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  async function run(fn: () => Promise<any>, close = false) {
    if (saving.current) return false;
    saving.current = true;
    setBusy(true);
    setError("");
    setFormError("");
    try {
      await fn();
      await reload();
      setNow(new Date());
      setToast(t("Changes saved.", "تم حفظ التغييرات."));
      if (close) {
        setModal(null);
        setAction(null);
      }
      return true;
    } catch (e: any) {
      setError(e.message);
      setFormError(e.message);
      if (e.message === "conflict") await reload();
      return false;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  async function act(entry: Entry, id: string, payload: Data = {}) {
    await run(
      () =>
        api(`/${p.id}/entries/${entry.id}/action`, "POST", {
          version: entry.version,
          action: id,
          payload,
        }),
      true,
    );
  }
  let filtered = rows.filter(
    (e) =>
      (filter === "all" || p.status(e.data, now) === filter) &&
      `${p.title(e.data)} ${p.subtitle(e.data, lang)} ${e.data.notes ?? ""}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
  );
  if (sort === "oldest")
    filtered.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (sort === "name")
    filtered.sort((a, b) =>
      p.title(a.data).localeCompare(p.title(b.data), lang),
    );
  if (sort === "priority")
    filtered.sort((a, b) => {
      const priority = (e: Entry) =>
        p.id === "queuewise"
          ? (e.data.status === "waiting" ? 0 : 1) * 2 +
            (e.data.priority === "assistance" ? 0 : 1)
          : Date.parse(
              e.data.dueAt ??
                e.data.expiresAt ??
                e.data.targetAt ??
                e.data.startsAt ??
                e.createdAt,
            );
      return (
        priority(a) - priority(b) || a.createdAt.localeCompare(b.createdAt)
      );
    });
  return (
    <div className={`workspace-body workspace-${p.id}`}>
      <ProductComposition
        lang={lang}
        p={p}
        now={now}
        create={() => {
          setFormError("");
          setModal("create");
        }}
        notices={
          <>
            {" "}
            {user.demo && (
              <div className="demo-banner">
                <span className="demo-dot" />
                {t(
                  "Demo workspace. Sample records are fictional; changes stay in this demo session.",
                  "مساحة تجريبية. السجلات أمثلة خيالية، والتغييرات تخص الجلسة دي.",
                )}
              </div>
            )}
            {p.kind === "desktop" && !user.desktop && (
              <div className="desktop-banner">
                <Desktop size={18} />
                {t(
                  "Browser preview · launch the Windows build for a local, offline workspace.",
                  "معاينة المتصفح · شغّل نسخة Windows لمساحة محلية دون إنترنت.",
                )}
              </div>
            )}
          </>
        }
        metrics={
          <>
            {" "}
            <div className="metrics">
              {p.metrics(rows, now, lang).map((m, i) => (
                <section className="metric" key={i}>
                  <span>{m.label[lang]}</span>
                  <strong>
                    {loading
                      ? "—"
                      : typeof m.value === "number"
                        ? new Intl.NumberFormat(
                            lang === "ar" ? "ar-EG" : "en-US",
                          ).format(m.value)
                        : m.value}
                  </strong>
                  <small>{m.note[lang]}</small>
                </section>
              ))}
            </div>
          </>
        }
        features={
          <>
            {" "}
            {p.id === "queuewise" && (
              <QueueDesk
                p={p}
                rows={rows}
                lang={lang}
                now={now}
                busy={busy}
                open={(e) => {
                  setSelected(e.id);
                  setFormError("");
                }}
                next={() => run(() => api("/queuewise/next", "POST", {}))}
                complete={(e) => act(e, "complete")}
              />
            )}
            <ProductFocus
              p={p}
              rows={rows}
              lang={lang}
              now={now}
              open={(e) => {
                setSelected(e.id);
                setFormError("");
              }}
            />
            {p.id === "fairshare" && rows.length > 0 && (
              <div className="balance-panel">
                <div>
                  <h2>{t("Who owes what", "مين له ومين عليه")}</h2>
                  <p>
                    {t(
                      "Positive = should receive. Negative = should pay. All amounts in EGP.",
                      "الموجب يستلم والسالب يدفع. كل المبالغ بالجنيه.",
                    )}
                  </p>
                  <div className="balances">
                    {Object.entries(balances(rows)).map(([name, n]) => (
                      <div key={name}>
                        <span>{name}</span>
                        <strong className={n < 0 ? "danger-text" : ""}>
                          {cash(n, lang)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="transfers">
                  {settlements(rows).length ? (
                    settlements(rows).map((s, i) => (
                      <div className="transfer" key={i}>
                        <span>
                          {s.from}
                          <ArrowRight size={15} />
                          {s.to}
                          <b>{cash(s.amount, lang)}</b>
                        </span>
                        <button
                          disabled={busy}
                          onClick={() =>
                            run(() => api("/fairshare/settle", "POST", s))
                          }
                        >
                          {t("Record as paid", "تسجيل الدفع")}
                        </button>
                      </div>
                    ))
                  ) : (
                    <p>
                      <CheckCircle /> {t("All settled.", "الحساب متوازن.")}
                    </p>
                  )}
                </div>
              </div>
            )}
            {p.id === "filenest" && (
              <FilePanel
                lang={lang}
                native={user.desktop}
                hasRules={rows.some((r) => r.data.status === "enabled")}
              />
            )}
            {error && <ErrorMessage error={error} lang={lang} />}
          </>
        }
        records={
          <>
            {" "}
            <section className="records-section" id="records">
              <div className="section-heading">
                <h2>
                  {t("Your ", "")}
                  {p.entity[lang]}
                  <span className="count-badge">{rows.length}</span>
                </h2>
                <details className="record-tools">
                  <summary>
                    {t("Tools", "الأدوات")} <ArrowDown size={13} />
                  </summary>
                  <div className="section-actions">
                    <button
                      title={t("Refresh", "تحديث")}
                      aria-label={t("Refresh", "تحديث")}
                      className="icon-button"
                      disabled={busy}
                      onClick={() => run(reload)}
                    >
                      <ArrowClockwise size={19} />
                    </button>
                    <button
                      className="secondary compact"
                      onClick={async () => {
                        setFormError("");
                        try {
                          setEvents(await api(`/${p.id}/events`));
                          setModal("history");
                        } catch (e: any) {
                          setError(e.message);
                        }
                      }}
                    >
                      <Clock size={17} />
                      {t("Activity", "النشاط")}
                    </button>
                    <button
                      className="secondary compact"
                      disabled={!rows.length}
                      onClick={() =>
                        download(
                          `${p.id}-export.csv`,
                          csv(
                            rows.map((r) => ({
                              id: r.id,
                              createdAt: r.createdAt,
                              ...r.data,
                            })),
                          ),
                          "text/csv;charset=utf-8",
                        )
                      }
                    >
                      <Download size={17} />
                      {t("Export CSV", "تصدير CSV")}
                    </button>
                    <button
                      className="secondary compact"
                      disabled={!rows.length}
                      onClick={() =>
                        download(
                          `${p.id}-backup.json`,
                          JSON.stringify(
                            {
                              schemaVersion: 1,
                              project: p.id,
                              exportedAt: new Date().toISOString(),
                              entries: rows,
                            },
                            null,
                            2,
                          ),
                        )
                      }
                    >
                      {t("JSON snapshot", "نسخة JSON")}
                    </button>
                  </div>
                </details>
              </div>
              <div className="toolbar">
                <label className="search">
                  <MagnifyingGlass size={19} />
                  <input
                    aria-label={t("Search records", "بحث في السجلات")}
                    placeholder={t(`Search ${p.entity.en}…`, "بحث في السجلات…")}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <label className="filter">
                  <span>{t("Status", "الحالة")}</span>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">
                      {t("All statuses", "كل الحالات")}
                    </option>
                    {Object.entries(p.statuses).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label[lang]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="filter">
                  <span>{t("Sort", "ترتيب")}</span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="newest">
                      {t("Newest first", "الأحدث أولًا")}
                    </option>
                    <option value="oldest">
                      {t("Oldest first", "الأقدم أولًا")}
                    </option>
                    <option value="name">{t("Name", "الاسم")}</option>
                    <option value="priority">
                      {t("Priority / date", "الأولوية / الموعد")}
                    </option>
                  </select>
                </label>
              </div>
              {loading ? (
                <div className="empty-state" role="status">
                  {t("Opening your workspace…", "جارٍ فتح مساحة العمل…")}
                </div>
              ) : !filtered.length ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Stack size={30} />
                  </div>
                  <h3>
                    {rows.length
                      ? t("No matches this time.", "لا توجد نتائج مطابقة.")
                      : t(
                          "A little space for a fresh start.",
                          "مساحة لبداية جديدة.",
                        )}
                  </h3>
                  <p>
                    {rows.length
                      ? t(
                          "Try another search or status.",
                          "جرّب بحثًا أو حالة أخرى.",
                        )
                      : p.problem[lang]}
                  </p>
                  {!rows.length && (
                    <div className="hero-actions">
                      <button
                        className="primary"
                        onClick={() => setModal("create")}
                      >
                        {p.createLabel[lang]}
                      </button>
                      <button
                        className="secondary"
                        disabled={busy}
                        onClick={() =>
                          run(() => api(`/${p.id}/seed`, "POST", {}))
                        }
                      >
                        {t("Load sample data", "إضافة بيانات تجريبية")}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <ProductRecords
                  p={p}
                  rows={filtered}
                  lang={lang}
                  now={now}
                  busy={busy}
                  open={(e) => {
                    setSelected(e.id);
                    setFormError("");
                  }}
                  action={(e, a) => {
                    setSelected(e.id);
                    setFormError("");
                    if (a.fields) setAction(a);
                    else act(e, a.id);
                  }}
                />
              )}
            </section>
          </>
        }
      />
      <div className="workspace-footer">
        <span>
          {t(
            "Changes are stored in this workspace.",
            "التغييرات محفوظة في مساحة العمل دي.",
          )}
        </span>
        <span>
          {t("Workspace time", "وقت مساحة العمل")}{" "}
          {now.toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle size={20} />
          {toast}
        </div>
      )}
      {modal === "create" && (
        <Modal
          title={p.createLabel[lang]}
          onClose={() => !busy && setModal(null)}
        >
          <DataForm
            fields={p.fields}
            lang={lang}
            busy={busy}
            error={formError}
            label={t("Save record", "حفظ السجل")}
            onSubmit={(data) =>
              run(() => api(`/${p.id}/entries`, "POST", data), true)
            }
          />
        </Modal>
      )}
      {modal === "edit" && selectedEntry && (
        <Modal
          title={t("Edit details", "تعديل التفاصيل")}
          onClose={() => !busy && setModal(null)}
        >
          <p className="modal-copy edit-note">
            {t(
              "Update the descriptive details. Transactions, quantities and activity history are preserved.",
              "عدّل التفاصيل الوصفية. الحركات والكميات وسجل النشاط محفوظين.",
            )}
          </p>
          <DataForm
            key={selectedEntry.version}
            fields={editFields(p)}
            initial={selectedEntry.data}
            lang={lang}
            busy={busy}
            error={formError}
            label={t("Save changes", "حفظ التعديلات")}
            onSubmit={(input) =>
              run(
                () =>
                  api(`/${p.id}/entries/${selectedEntry.id}`, "PATCH", {
                    version: selectedEntry.version,
                    input,
                  }),
                true,
              )
            }
          />
        </Modal>
      )}
      {selectedEntry && !action && modal === null && (
        <Modal
          title={p.title(selectedEntry.data)}
          onClose={() => !busy && setSelected(null)}
        >
          <Details
            p={p}
            e={selectedEntry}
            lang={lang}
            now={now}
            act={(a, payload) => act(selectedEntry, a, payload)}
            busy={busy}
          />
          {formError && <ErrorMessage error={formError} lang={lang} />}
          <div className="detail-actions">
            {selectedEntry.data.kind !== "settlement" && (
              <button
                className="secondary"
                disabled={busy}
                onClick={() => {
                  setFormError("");
                  setModal("edit");
                }}
              >
                <PencilSimple size={18} />
                {t("Edit details", "تعديل التفاصيل")}
              </button>
            )}
            {p.actions
              .filter((a) => a.when(selectedEntry.data))
              .map((a) => (
                <button
                  key={a.id}
                  className="secondary"
                  disabled={busy}
                  onClick={() => {
                    setFormError("");
                    if (a.fields) setAction(a);
                    else act(selectedEntry, a.id);
                  }}
                >
                  {a.label[lang]}
                </button>
              ))}
            <button
              className="icon-button danger-text"
              disabled={busy}
              title={t("Delete record", "حذف السجل")}
              aria-label={t("Delete record", "حذف السجل")}
              onClick={() => setModal("delete")}
            >
              <Trash size={20} />
            </button>
          </div>
        </Modal>
      )}
      {selectedEntry && action && (
        <Modal
          title={action.label[lang]}
          onClose={() => !busy && setAction(null)}
        >
          <DataForm
            fields={action.fields ?? []}
            lang={lang}
            busy={busy}
            error={formError}
            label={t("Confirm", "تأكيد")}
            onSubmit={(payload) => act(selectedEntry, action.id, payload)}
          />
        </Modal>
      )}
      {modal === "delete" && selectedEntry && (
        <Modal
          title={t("Delete this record?", "حذف السجل؟")}
          onClose={() => !busy && setModal(null)}
        >
          <p className="modal-copy">
            {t(
              "This removes the record and its details. The activity log keeps a deletion event. Export a snapshot first if you need a copy.",
              "هيتم حذف السجل وتفاصيله. سجل النشاط يحتفظ بعملية الحذف. صدّر نسخة أولًا لو محتاجها.",
            )}
          </p>
          <div className="detail-actions">
            <button className="secondary" onClick={() => setModal(null)}>
              {t("Keep record", "احتفظ بالسجل")}
            </button>
            <button
              className="primary destructive"
              disabled={busy}
              onClick={async () => {
                if (
                  await run(
                    () =>
                      api(`/${p.id}/entries/${selectedEntry.id}`, "DELETE", {
                        version: selectedEntry.version,
                      }),
                    true,
                  )
                )
                  setSelected(null);
              }}
            >
              {t("Delete record", "حذف السجل")}
            </button>
          </div>
        </Modal>
      )}
      {modal === "history" && (
        <Modal
          title={t("Workspace activity", "نشاط مساحة العمل")}
          onClose={() => setModal(null)}
        >
          <div className="activity-list">
            {events.length ? (
              events.map((e) => (
                <div className="ledger-row" key={e.id}>
                  <span>
                    {translateAction(e.action, lang)}
                    <small>{e.details.title ?? e.entry_id?.slice(0, 8)}</small>
                  </span>
                  <time>{fmtDate(e.at, lang, true)}</time>
                </div>
              ))
            ) : (
              <p>{t("No activity recorded yet.", "لا يوجد نشاط بعد.")}</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
function translateAction(action: string, lang: Lang) {
  const ar: Record<string, string> = {
    created: "إنشاء سجل",
    edited: "تعديل التفاصيل",
    deleted: "حذف سجل",
    call: "نداء زائر",
    complete: "إكمال",
    cancel: "إلغاء",
    assign: "تعيين",
    start: "بدء العمل",
    resolve: "حل المشكلة",
    verify: "تأكيد",
    reopen: "إعادة فتح",
    reserve: "حجز",
    collect: "استلام",
    release: "إلغاء حجز",
    milestone: "تحديث تسليم",
    payment: "تسجيل دفعة",
    join: "إضافة متطوع",
    attendance: "تسجيل حضور",
    toggle: "تغيير تفعيل",
    claim: "فتح مطالبة",
    receive: "استلام مخزون",
    issue: "صرف مخزون",
    review: "مراجعة بطاقة",
  };
  return lang === "ar" ? (ar[action] ?? action) : action.replaceAll("_", " ");
}
function FilePanel({
  lang,
  native,
  hasRules,
}: {
  lang: Lang;
  native: boolean;
  hasRules: boolean;
}) {
  const t = useCopy(lang),
    [result, setResult] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function operation(op: "preview" | "apply" | "undo") {
    if (!window.desktop) return;
    setBusy(true);
    setError("");
    try {
      const data = await window.desktop.files(op);
      if (data) setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="file-panel" id="file-workspace">
      <div className="special-banner">
        <div>
          <FolderOpen size={28} />
          <div>
            <h2>{t("Preview before you move.", "عاين قبل ما تنقل.")}</h2>
            <p>
              {t(
                "Direct files only · no deletion · existing names are preserved.",
                "الملفات المباشرة فقط · دون حذف محتوى · الأسماء الموجودة محفوظة.",
              )}
            </p>
          </div>
        </div>
        <div className="inline-actions">
          <button
            className="secondary"
            disabled={!native || busy}
            onClick={() => operation("undo")}
          >
            <ArrowUUpLeft />
            {t("Undo last move", "تراجع عن آخر نقل")}
          </button>
          <button
            className="primary"
            disabled={!native || busy || !hasRules}
            onClick={() => operation("preview")}
          >
            <FolderOpen />
            {busy
              ? t("Working…", "جارٍ العمل…")
              : t("Choose a folder", "اختيار مجلد")}
          </button>
        </div>
      </div>
      {!native && (
        <p className="file-help">
          {t(
            "Native folder selection is available in FileNest for Windows. Here you can create and test your sorting rules.",
            "اختيار المجلد متاح في FileNest على Windows. هنا تقدر تنشئ قواعد التنظيم.",
          )}
        </p>
      )}
      {error && <ErrorMessage error={error} lang={lang} />}{" "}
      {result && (
        <div className="file-preview">
          <h3>
            {result.kind === "preview"
              ? t("Move preview", "معاينة النقل")
              : t("Operation receipt", "سجل العملية")}
          </h3>
          <code>{result.root}</code>
          {result.files.length === 0 && (
            <p>{t("No matching files found.", "لا توجد ملفات مطابقة.")}</p>
          )}
          {result.files.map((f: any) => (
            <div className="ledger-row" key={f.name}>
              <span>
                {f.name}
                <small>
                  {f.folder}/{f.name}
                  {f.duplicate
                    ? " · " +
                      t("Identical content detected", "تم اكتشاف محتوى متطابق")
                    : ""}
                </small>
              </span>
              <span>
                {f.error ?? f.state ?? `${Math.ceil(f.size / 1024)} KB`}
              </span>
            </div>
          ))}
          {result.kind === "preview" && (
            <>
              <p>
                {result.files.length}{" "}
                {t(
                  "files to move. Unmatched, nested, symlinked and >100MB files are skipped.",
                  "ملفات للنقل. يتم تخطي غير المطابق والمجلدات الفرعية والروابط والملفات الأكبر من ١٠٠ ميجابايت.",
                )}
              </p>
              <button
                className="primary"
                disabled={busy || !result.files.length}
                onClick={() => operation("apply")}
              >
                {t("Move these files", "نقل الملفات دي")}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
