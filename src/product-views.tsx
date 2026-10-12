import {
  ArrowRight,
  CheckCircle,
  Clock,
  ArrowUpRight,
  UsersThree,
} from "@phosphor-icons/react";
import {
  c,
  cash,
  type Project,
  type Entry,
  type Lang,
  type Copy,
} from "./contracts";
import { Status, Progress, fmtDate, useCopy } from "./components";

export const productCopy: Record<
  string,
  { section: Copy; description: Copy; category: Copy }
> = {
  queuewise: {
    section: c("Service desk", "مكتب الخدمة"),
    description: c(
      "Manage arrivals, call visitors and keep the queue moving.",
      "تابع الوصول ونادِ الزائر التالي وأكمل الخدمة.",
    ),
    category: c("Visitor operations", "إدارة الزوار"),
  },
  fixlane: {
    section: c("Maintenance board", "لوحة الصيانة"),
    description: c(
      "A clear owner and next step for every repair.",
      "مسؤول واضح وخطوة تالية لكل طلب صيانة.",
    ),
    category: c("Property maintenance", "صيانة المباني"),
  },
  rescuetable: {
    section: c("Available for pickup", "جاهز للاستلام"),
    description: c(
      "Coordinate surplus food before the collection window closes.",
      "نظّم توزيع فائض الطعام قبل انتهاء موعد الاستلام.",
    ),
    category: c("Food redistribution", "توزيع فائض الطعام"),
  },
  scopedesk: {
    section: c("Project workspace", "مساحة المشروعات"),
    description: c(
      "Deliverables, deadlines and payments, together.",
      "التسليمات والمواعيد والدفعات في مكان واحد.",
    ),
    category: c("Freelance operations", "إدارة العمل الحر"),
  },
  givetime: {
    section: c("Volunteer schedule", "جدول التطوع"),
    description: c(
      "Plan the next shift. Know who is showing up.",
      "خطط للنشاط القادم وتابع المشاركة والحضور.",
    ),
    category: c("Volunteer coordination", "تنسيق التطوع"),
  },
  filenest: {
    section: c("Folder organizer", "تنظيم المجلدات"),
    description: c(
      "Choose a folder, inspect the plan, then move files.",
      "اختَر مجلدًا وراجع خطة التنظيم قبل نقل الملفات.",
    ),
    category: c("Local file utility", "أداة ملفات محلية"),
  },
  warrantyvault: {
    section: c("Your purchase register", "سجل المشتريات"),
    description: c(
      "Purchase details, warranty dates and claim history.",
      "تفاصيل الشراء ومواعيد الضمان وسجل المطالبات.",
    ),
    category: c("Purchase records", "سجلات المشتريات"),
  },
  stockroom: {
    section: c("Inventory", "المخزون"),
    description: c(
      "Check availability, record movements and spot low stock.",
      "راجع الكميات وسجّل الحركات وتابع الأصناف الناقصة.",
    ),
    category: c("Inventory control", "إدارة المخزون"),
  },
  fairshare: {
    section: c("Household ledger", "دفتر المصروفات"),
    description: c(
      "Shared expenses, exact splits and clear balances.",
      "مصروفات مشتركة وتقسيم دقيق وأرصدة واضحة.",
    ),
    category: c("Shared expenses", "المصروفات المشتركة"),
  },
  recall: {
    section: c("Study room", "مساحة المذاكرة"),
    description: c(
      "Practice what is due. Give the rest time.",
      "راجع البطاقات المستحقة واترك الباقي لموعده.",
    ),
    category: c("Spaced repetition", "التكرار المتباعد"),
  },
};

export function QueueDesk({
  p,
  rows,
  lang,
  now,
  busy,
  open,
  next,
  complete,
}: {
  p: Project;
  rows: Entry[];
  lang: Lang;
  now: Date;
  busy: boolean;
  open: (e: Entry) => void;
  next: () => void;
  complete: (e: Entry) => void;
}) {
  const t = useCopy(lang),
    serving = rows.filter((r) => r.data.status === "serving");
  const waiting = rows
    .filter((r) => r.data.status === "waiting")
    .sort(
      (a, b) =>
        Number(b.data.priority === "assistance") -
          Number(a.data.priority === "assistance") ||
        a.data.arrivedAt.localeCompare(b.data.arrivedAt) ||
        a.id.localeCompare(b.id),
    );
  return (
    <section
      className="queue-desk"
      aria-label={t("Service overview", "ملخص الخدمة")}
    >
      <div className="service-now">
        <div className="panel-label">
          <span className="live-dot" />
          {t("At the desk", "في مكتب الخدمة")}
          <span>{serving.length}</span>
        </div>
        {serving.length ? (
          serving.slice(0, 2).map((entry) => (
            <div key={entry.id} className="serving-person">
              <span className="person-avatar">
                {entry.data.name.slice(0, 1)}
              </span>
              <div>
                <button onClick={() => open(entry)}>{entry.data.name}</button>
                <p>{p.subtitle(entry.data, lang)}</p>
              </div>
              <button
                className="serve-complete"
                disabled={busy}
                onClick={() => complete(entry)}
                aria-label={t(
                  `Complete service for ${entry.data.name}`,
                  `إكمال خدمة ${entry.data.name}`,
                )}
              >
                <CheckCircle size={25} />
              </button>
            </div>
          ))
        ) : (
          <div className="desk-empty">
            <UsersThree size={32} />
            <h2>{t("Ready for the next visitor", "جاهز للزائر التالي")}</h2>
          </div>
        )}
        {serving.length > 2 && (
          <p>
            {t(
              `${serving.length - 2} more in the list below`,
              `${serving.length - 2} آخرين في القائمة بالأسفل`,
            )}
          </p>
        )}
        <p className="service-hint">
          {t(
            "Mark a service complete when the visitor is finished.",
            "أكمل الخدمة عند الانتهاء من مساعدة الزائر.",
          )}
        </p>
      </div>
      <div className="next-visitor">
        <div className="panel-label">
          {t("Next in line", "التالي في الانتظار")}
          <span>{t("Priority → arrival", "الأولوية ← الوصول")}</span>
        </div>
        {waiting[0] ? (
          <>
            <h2>{waiting[0].data.name}</h2>
            <p>
              {p.subtitle(waiting[0].data, lang)}
              <span>·</span>
              <Clock size={15} />
              {Math.max(
                0,
                Math.floor(
                  (+now - Date.parse(waiting[0].data.arrivedAt)) / 60000,
                ),
              )}{" "}
              {t("min", "دقيقة")}
            </p>
          </>
        ) : (
          <>
            <h2>{t("The queue is clear", "لا يوجد انتظار")}</h2>
            <p>
              {t("New arrivals will appear here.", "الزوار الجدد هيظهروا هنا.")}
            </p>
          </>
        )}
        <button
          className="primary"
          disabled={busy || !waiting.length}
          onClick={next}
        >
          {t("Call next visitor", "نداء الزائر التالي")}
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}

export const tableProjects = new Set([
  "queuewise",
  "stockroom",
  "scopedesk",
  "fairshare",
]);
export function ProductTable({
  p,
  rows,
  lang,
  now,
  open,
}: {
  p: Project;
  rows: Entry[];
  lang: Lang;
  now: Date;
  open: (e: Entry) => void;
}) {
  const t = useCopy(lang);
  const headings: Record<string, string[]> = {
    queuewise: [
      t("Visitor", "الزائر"),
      t("Arrival", "الوصول"),
      t("Priority", "الأولوية"),
      t("Status", "الحالة"),
    ],
    stockroom: [
      t("Product / SKU", "الصنف / الكود"),
      t("On hand", "المتاح"),
      t("Reorder point", "حد إعادة الطلب"),
      t("Unit cost", "تكلفة الوحدة"),
      t("Status", "الحالة"),
    ],
    scopedesk: [
      t("Project / client", "المشروع / العميل"),
      t("Delivery", "التسليم"),
      t("Outstanding", "المتبقي"),
      t("Due date", "الموعد"),
      t("Status", "الحالة"),
    ],
    fairshare: [
      t("Expense", "المصروف"),
      t("Paid by", "دفع بواسطة"),
      t("Amount", "المبلغ"),
      t("Date", "التاريخ"),
      t("Type", "النوع"),
    ],
    warrantyvault: [
      t("Product / retailer", "المنتج / البائع"),
      t("Serial number", "الرقم التسلسلي"),
      t("Purchase price", "سعر الشراء"),
      t("Coverage ends", "نهاية الضمان"),
      t("Status", "الحالة"),
    ],
  };
  return (
    <div className={`table-container table-${p.id}`}>
      <table className="product-table">
        <caption className="visually-hidden">{p.entity[lang]}</caption>
        <thead>
          <tr>
            {headings[p.id].map((label) => (
              <th key={label} scope="col">
                {label}
              </th>
            ))}
            <th scope="col">
              <span className="visually-hidden">
                {t("Details", "التفاصيل")}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => {
            const d = e.data;
            let cells: React.ReactNode[] = [];
            if (p.id === "queuewise")
              cells = [
                <span className="mono">
                  {new Date(d.arrivedAt).toLocaleTimeString(
                    lang === "ar" ? "ar-EG" : "en-GB",
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                  <small>
                    {Math.max(
                      0,
                      Math.floor((+now - Date.parse(d.arrivedAt)) / 60000),
                    )}{" "}
                    {t("min ago", "دقيقة مضت")}
                  </small>
                </span>,
                <span
                  className={
                    d.priority === "assistance" ? "priority-label" : ""
                  }
                >
                  {d.priority === "assistance"
                    ? t("Assistance", "مساعدة")
                    : t("Standard", "عادية")}
                </span>,
              ];
            if (p.id === "stockroom")
              cells = [
                <strong className="quantity-value">
                  {d.quantity.toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
                </strong>,
                d.reorder,
                cash(d.unitCost, lang),
              ];
            if (p.id === "scopedesk")
              cells = [
                <Progress
                  value={d.milestones.filter((m: any) => m.done).length}
                  max={d.milestones.length}
                  label={t("Completed", "مكتمل")}
                />,
                <strong>{cash(d.budget - d.paid, lang)}</strong>,
                fmtDate(d.dueDate, lang),
              ];
            if (p.id === "fairshare")
              cells = [
                d.paidBy,
                <strong className="ledger-amount">
                  {cash(d.amount, lang)}
                </strong>,
                fmtDate(d.date, lang),
              ];
            if (p.id === "warrantyvault")
              cells = [
                <code>{d.serial || "—"}</code>,
                cash(d.price, lang),
                fmtDate(d.expiresAt, lang),
              ];
            return (
              <tr key={e.id} className="record-card">
                <td data-label={headings[p.id][0]}>
                  <div className="table-identity">
                    <span className="table-avatar">
                      {p.id === "stockroom" ? "#" : p.title(d).slice(0, 1)}
                    </span>
                    <div>
                      <button className="record-title" onClick={() => open(e)}>
                        {p.title(d)}
                      </button>
                      <p className="record-subtitle">{p.subtitle(d, lang)}</p>
                    </div>
                  </div>
                </td>
                {cells.map((cell, i) => (
                  <td key={i} data-label={headings[p.id][i + 1]}>
                    {cell}
                  </td>
                ))}
                <td data-label={headings[p.id].at(-1)}>
                  <Status project={p} entry={e} lang={lang} now={now} />
                </td>
                <td>
                  <button
                    className="table-open"
                    onClick={() => open(e)}
                    aria-label={t(
                      `Open details for ${p.title(d)}`,
                      `عرض تفاصيل ${p.title(d)}`,
                    )}
                  >
                    <span>{t("Details", "التفاصيل")}</span>
                    <ArrowUpRight size={18} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ProductFocus({
  p,
  rows,
  lang,
  now,
  open,
}: {
  p: Project;
  rows: Entry[];
  lang: Lang;
  now: Date;
  open: (e: Entry) => void;
}) {
  const t = useCopy(lang);
  if (p.id === "recall") {
    const due = rows
      .filter((e) => Date.parse(e.data.dueAt) <= +now)
      .sort((a, b) => a.data.dueAt.localeCompare(b.data.dueAt));
    const topics = new Set(rows.map((e) => e.data.topic));
    return (
      <section className="study-focus">
        <div className="study-prompt">
          <span className="panel-label">
            {t("Next review", "المراجعة التالية")}
          </span>
          <h2>
            {due[0]
              ? due[0].data.question
              : t("You are up to date.", "خلصت مراجعاتك الحالية.")}
          </h2>
          <p>
            {due[0]?.data.topic ??
              t(
                "Your next scheduled card will appear here.",
                "البطاقة القادمة هتظهر هنا في موعدها.",
              )}
          </p>
          <button
            className="primary"
            disabled={!due.length}
            onClick={() => due[0] && open(due[0])}
          >
            {t("Start a review", "ابدأ مراجعة")}
            <ArrowRight size={18} />
          </button>
        </div>
        <div className="study-index">
          <span>{t("In your library", "في مكتبتك")}</span>
          <strong>
            {topics.size.toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
          </strong>
          <span>{t("study topics", "موضوعات للمراجعة")}</span>
          <div>
            {[...topics].slice(0, 4).map((topic) => (
              <span key={topic}>{topic}</span>
            ))}
          </div>
        </div>
      </section>
    );
  }
  if (p.id === "givetime") {
    const next = rows
      .filter(
        (e) =>
          Date.parse(e.data.startsAt) > +now && e.data.status !== "cancelled",
      )
      .sort((a, b) => a.data.startsAt.localeCompare(b.data.startsAt))[0];
    if (!next) return null;
    const date = new Date(next.data.startsAt);
    return (
      <section className="shift-focus">
        <div className="calendar-date">
          <span>
            {date.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", {
              month: "short",
            })}
          </span>
          <strong>
            {date.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", {
              day: "numeric",
            })}
          </strong>
        </div>
        <div>
          <span className="panel-label">
            {t("Next on the calendar", "النشاط القادم")}
          </span>
          <h2>{next.data.title}</h2>
          <p>
            {next.data.location} · {next.data.hours} {t("hours", "ساعات")}
          </p>
        </div>
        <button className="secondary" onClick={() => open(next)}>
          {t("Manage volunteers", "إدارة المتطوعين")}
          <ArrowRight size={18} />
        </button>
      </section>
    );
  }
  if (p.id === "rescuetable") {
    const active = rows
      .filter(
        (e) =>
          Date.parse(e.data.expiresAt) > +now &&
          e.data.portions > e.data.reserved + e.data.collected,
      )
      .sort((a, b) => a.data.expiresAt.localeCompare(b.data.expiresAt));
    if (!active.length) return null;
    return (
      <section className="pickup-focus">
        <div>
          <span className="panel-label">
            {t("Closing soonest", "أقرب موعد انتهاء")}
          </span>
          <h2>{active[0].data.title}</h2>
          <p>
            {active[0].data.location} ·{" "}
            {fmtDate(active[0].data.expiresAt, lang, true)}
          </p>
        </div>
        <div className="pickup-count">
          <strong>
            {active[0].data.portions -
              active[0].data.reserved -
              active[0].data.collected}
          </strong>
          <span>{t("portions available", "حصة متاحة")}</span>
        </div>
        <button className="primary" onClick={() => open(active[0])}>
          {t("View collection", "تفاصيل الاستلام")}
          <ArrowRight size={18} />
        </button>
      </section>
    );
  }
  return null;
}
