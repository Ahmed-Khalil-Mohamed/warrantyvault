import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";
import { X, ArrowUpRight, Check, Clock } from "@phosphor-icons/react";
import {
  cash,
  c,
  type Project,
  type Entry,
  type Lang,
  type Copy,
  type Field,
  type Data,
} from "./contracts";
import { errors } from "./i18n";
export const useCopy = (lang: Lang) => (en: string, ar: string) =>
  lang === "en" ? en : ar;
export function RecordCollection({
  p,
  entries,
  lang,
  children,
}: {
  p: Project;
  entries: Entry[];
  lang: Lang;
  children: (entry: Entry, index: number) => ReactNode;
}) {
  if (p.id !== "fixlane")
    return (
      <div className={`records-grid layout-${p.id}`}>
        {entries.map(children)}
      </div>
    );
  const columns = [
    { title: c("Reported", "بلاغات جديدة"), states: ["open"] },
    {
      title: c("Repair in motion", "تحت التنفيذ"),
      states: ["assigned", "in_progress"],
    },
    {
      title: c("Resolution & verification", "الإصلاح والتأكيد"),
      states: ["resolved", "verified"],
    },
  ];
  return (
    <div className="repair-board">
      {columns.map((column, i) => {
        const rows = entries.filter((entry) =>
          column.states.includes(entry.data.status),
        );
        return (
          <section
            className="repair-lane"
            key={i}
            aria-label={column.title[lang]}
          >
            <h3>
              <span>{column.title[lang]}</span>
              <span className="count-badge">{rows.length}</span>
            </h3>
            <div className="repair-lane-cards">
              {rows.length ? (
                rows.map((entry) => children(entry, entries.indexOf(entry)))
              ) : (
                <p className="lane-empty">
                  {lang === "en"
                    ? "No requests at this stage."
                    : "لا توجد طلبات في المرحلة دي."}
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
export function ErrorMessage({ error, lang }: { error: string; lang: Lang }) {
  return (
    <div role="alert" className="message error">
      {errors[error]?.[lang] ?? error}
    </div>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal-head">
        <h2 id="modal-title">{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close / إغلاق"
        >
          <X size={22} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function DataForm({
  fields,
  lang,
  onSubmit,
  label,
  busy,
  error,
  initial = {},
}: {
  fields: Field[];
  lang: Lang;
  onSubmit: (d: Data) => void;
  label: string;
  busy: boolean;
  error: string;
  initial?: Data;
}) {
  const t = useCopy(lang);
  const [localError, setLocalError] = useState("");
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setLocalError("");
    const form = new FormData(e.currentTarget),
      result: Data = {};
    for (const field of fields) {
      const value = String(form.get(field.key) ?? "").trim();
      if (field.type === "money") {
        if (!/^\d+(\.\d{1,2})?$/.test(value) || Number(value) <= 0) {
          setLocalError("invalid_money");
          return;
        }
        result[field.key] = Math.round(Number(value) * 100);
      } else if (field.type === "number") result[field.key] = Number(value);
      else if (field.type === "datetime-local") {
        if (!value || !Number.isFinite(Date.parse(value))) {
          setLocalError("invalid_input");
          return;
        }
        result[field.key] = new Date(value).toISOString();
      } else result[field.key] = value;
    }
    onSubmit(result);
  }
  return (
    <form onSubmit={submit} className="data-form">
      {fields.map((f) => (
        <label key={f.key} className={f.type === "textarea" ? "full" : ""}>
          <span>
            {f.label[lang]}
            {f.required && <span aria-hidden="true"> *</span>}
          </span>
          {f.type === "select" ? (
            <select
              name={f.key}
              defaultValue={
                initial[f.key] ?? f.default ?? f.options?.[0]?.value
              }
            >
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label[lang]}
                </option>
              ))}
            </select>
          ) : f.type === "textarea" ? (
            <textarea
              name={f.key}
              required={f.required}
              maxLength={3000}
              rows={3}
              defaultValue={initial[f.key] ?? f.default}
            />
          ) : (
            <input
              name={f.key}
              type={f.type === "money" ? "number" : (f.type ?? "text")}
              step={
                f.type === "money"
                  ? "0.01"
                  : f.type === "number"
                    ? 1
                    : undefined
              }
              min={f.type === "money" ? 0.01 : f.min}
              max={f.type === "money" ? 1000000 : f.max}
              maxLength={300}
              required={f.required}
              defaultValue={initial[f.key] ?? f.default}
            />
          )}{" "}
          {f.hint && <small>{f.hint[lang]}</small>}
        </label>
      ))}
      {(error || localError) && (
        <div className="full">
          <ErrorMessage error={error || localError} lang={lang} />
        </div>
      )}
      <div className="form-footer full">
        <span>
          {t("Fields marked * are required.", "الحقول بعلامة * مطلوبة.")}
        </span>
        <button className="primary" disabled={busy}>
          {busy ? t("Saving…", "جارٍ الحفظ…") : label}
        </button>
      </div>
    </form>
  );
}
export function Status({
  project,
  entry,
  lang,
  now,
}: {
  project: Project;
  entry: Entry;
  lang: Lang;
  now: Date;
}) {
  const status = project.status(entry.data, now);
  return (
    <span className={`status status-${status}`}>
      <span />
      {project.statuses[status]?.[lang] ?? status}
    </span>
  );
}
export const fmtDate = (v: string, lang: Lang, time = false) =>
  new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(time ? { hour: "2-digit" as const, minute: "2-digit" as const } : {}),
  }).format(new Date(v.length === 10 ? v + "T12:00:00" : v));
export function Progress({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  return (
    <div className="progress-wrap">
      <div className="progress-label">
        <span>{label}</span>
        <strong>
          {value} / {max}
        </strong>
      </div>
      <progress value={value} max={Math.max(max, 1)} aria-label={label} />
    </div>
  );
}
export function RecordSummary({
  p,
  e,
  lang,
  now,
}: {
  p: Project;
  e: Entry;
  lang: Lang;
  now: Date;
}) {
  const d = e.data,
    t = useCopy(lang);
  switch (p.id) {
    case "queuewise":
      return (
        <div className="record-facts">
          <span>
            <Clock />
            {Math.max(
              0,
              Math.floor((+now - Date.parse(d.arrivedAt)) / 60000),
            )}{" "}
            {t("min since arrival", "دقيقة من الوصول")}
          </span>
          <span>
            {d.priority === "assistance"
              ? t("Assistance priority", "أولوية مساعدة")
              : t("Standard priority", "أولوية عادية")}
          </span>
        </div>
      );
    case "fixlane":
      return (
        <div className="record-facts">
          <span>{d.assignee || t("Unassigned", "لم يُعيّن فني")}</span>
          <span
            className={
              Date.parse(d.targetAt) < +now &&
              !["resolved", "verified"].includes(d.status)
                ? "danger-text"
                : ""
            }
          >
            {t("Target: ", "الموعد: ")}
            {fmtDate(d.targetAt, lang, true)}
          </span>
        </div>
      );
    case "rescuetable":
      return (
        <>
          <Progress
            value={d.collected}
            max={d.portions}
            label={t("Portions collected", "حصص مستلمة")}
          />
          <div className="record-facts">
            <span>
              {d.portions - d.reserved - d.collected} {t("available", "متاحة")}
            </span>
            <span>{fmtDate(d.expiresAt, lang, true)}</span>
          </div>
        </>
      );
    case "scopedesk":
      return (
        <>
          <Progress
            value={d.milestones.filter((m: any) => m.done).length}
            max={d.milestones.length}
            label={t("Deliverables", "التسليمات")}
          />
          <div className="record-facts">
            <span>
              {cash(d.budget - d.paid, lang)} {t("remaining", "متبقي")}
            </span>
            <span>{fmtDate(d.dueDate, lang)}</span>
          </div>
        </>
      );
    case "givetime":
      return (
        <>
          <Progress
            value={d.volunteers.length}
            max={d.capacity}
            label={t("Volunteer places", "أماكن المتطوعين")}
          />
          <div className="record-facts">
            <span>{fmtDate(d.startsAt, lang, true)}</span>
            <span>
              {d.hours} {t("hours", "ساعات")}
            </span>
          </div>
        </>
      );
    case "filenest":
      return (
        <div className="rule-path">
          <code>*.{d.extensions.split(",").join("  *.")}</code>
          <ArrowUpRight size={20} />
          <strong>{d.folder}/</strong>
        </div>
      );
    case "warrantyvault":
      return (
        <div className="record-facts">
          <span>{cash(d.price, lang)}</span>
          <span>
            {t("Warranty ends ", "ينتهي الضمان ")}
            {fmtDate(d.expiresAt, lang)}
          </span>
        </div>
      );
    case "stockroom":
      return (
        <div className="stock-numbers">
          <strong>
            {d.quantity}
            <small>{t("units on hand", "وحدة متاحة")}</small>
          </strong>
          <div>
            {t("Reorder at", "إعادة الطلب عند")} <b>{d.reorder}</b>
            <small>
              {cash(d.unitCost, lang)} / {t("unit", "وحدة")}
            </small>
          </div>
        </div>
      );
    case "fairshare":
      return (
        <div className="record-facts">
          <strong className="amount">{cash(d.amount, lang)}</strong>
          <span>{fmtDate(d.date, lang)}</span>
        </div>
      );
    case "recall":
      return (
        <div className="record-facts">
          <span>
            {d.reviews.length} {t("reviews", "مراجعات")}
          </span>
          <span>
            {t("Next: ", "التالي: ")}
            {fmtDate(d.dueAt, lang, true)}
          </span>
        </div>
      );
    default:
      return null;
  }
}
export function Details({
  p,
  e,
  lang,
  now,
  act,
  busy,
}: {
  p: Project;
  e: Entry;
  lang: Lang;
  now: Date;
  act: (action: string, payload: Data) => void;
  busy: boolean;
}) {
  const d = e.data,
    t = useCopy(lang);
  const [reveal, setReveal] = useState(false);
  useEffect(() => setReveal(false), [e.id]);
  return (
    <div className="details">
      <Status project={p} entry={e} lang={lang} now={now} />
      <p className="detail-subtitle">{p.subtitle(d, lang)}</p>
      <RecordSummary p={p} e={e} lang={lang} now={now} />
      {d.notes && (
        <div className="note-block">
          <h3>{t("Notes", "ملاحظات")}</h3>
          <p>{d.notes}</p>
        </div>
      )}
      {p.id === "scopedesk" && (
        <>
          <h3>{t("Deliverables", "التسليمات")}</h3>
          <ul className="detail-list">
            {d.milestones.map((m: any) => (
              <li key={m.id}>
                <button
                  className={`check-row ${m.done ? "done" : ""}`}
                  disabled={busy || d.status === "completed"}
                  onClick={() => act("milestone", { milestoneId: m.id })}
                >
                  <span className="checkbox">{m.done && <Check />}</span>
                  {m.title}
                </button>
              </li>
            ))}
          </ul>
          <h3>{t("Payments", "الدفعات")}</h3>
          {d.payments.length ? (
            d.payments.map((x: any, i: number) => (
              <div className="ledger-row" key={i}>
                <span>
                  {x.reference}
                  <small>{fmtDate(x.at, lang)}</small>
                </span>
                <b>{cash(x.amount, lang)}</b>
              </div>
            ))
          ) : (
            <p>{t("No payments recorded.", "لا توجد دفعات مسجلة.")}</p>
          )}
          <button className="secondary" onClick={() => window.print()}>
            {t("Print project statement", "طباعة كشف المشروع")}
          </button>
        </>
      )}
      {p.id === "rescuetable" && (
        <>
          <h3>{t("Pickup reservations", "حجوزات الاستلام")}</h3>
          {d.reservations.length ? (
            d.reservations.map((r: any) => (
              <div className="ledger-row" key={r.id}>
                <span>
                  {r.name}
                  <small>
                    {r.quantity} {t("portions", "حصص")} ·{" "}
                    {r.status === "reserved"
                      ? t("Reserved", "محجوز")
                      : r.status === "collected"
                        ? t("Collected", "تم الاستلام")
                        : t("Released", "تم الإلغاء")}
                  </small>
                </span>
                {r.status === "reserved" && (
                  <div className="inline-actions">
                    <button
                      disabled={busy || Date.parse(d.expiresAt) <= +now}
                      onClick={() => act("collect", { reservationId: r.id })}
                    >
                      {t("Collect", "استلام")}
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => act("release", { reservationId: r.id })}
                    >
                      {t("Release", "إلغاء")}
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>{t("No reservations yet.", "لا توجد حجوزات بعد.")}</p>
          )}
          <p className="muted">
            {t(
              "Food information is entered by the donor. Confirm allergens and storage conditions before collection.",
              "معلومات الطعام من المتبرع. تأكد من مسببات الحساسية وشروط الحفظ قبل الاستلام.",
            )}
          </p>
        </>
      )}
      {p.id === "givetime" && (
        <>
          <h3>{t("Volunteer attendance", "حضور المتطوعين")}</h3>
          {d.volunteers.map((v: any) => (
            <button
              key={v.id}
              className={`check-row ${v.attended ? "done" : ""}`}
              disabled={
                busy ||
                d.status === "completed" ||
                Date.parse(d.startsAt) > +now
              }
              onClick={() => act("attendance", { volunteerId: v.id })}
            >
              <span className="checkbox">{v.attended && <Check />}</span>
              {v.name}
              <small>
                {v.attended ? t("Present", "حاضر") : t("Not marked", "لم يسجل")}
              </small>
            </button>
          ))}
          {!d.volunteers.length && (
            <p>{t("Add volunteers to this shift.", "أضف متطوعين للوردية.")}</p>
          )}
        </>
      )}
      {p.id === "warrantyvault" && (
        <>
          <div className="ledger-row">
            <span>{t("Purchased", "تاريخ الشراء")}</span>
            <b>{fmtDate(d.purchasedAt, lang)}</b>
          </div>
          <h3>{t("Claim history", "تاريخ المطالبات")}</h3>
          {d.claims.length ? (
            d.claims.map((x: any, i: number) => (
              <div className="note-block" key={i}>
                <b>{x.reference}</b>
                <p>{x.outcome || t("Awaiting resolution", "بانتظار الحل")}</p>
                <small>{fmtDate(x.openedAt, lang)}</small>
              </div>
            ))
          ) : (
            <p>{t("No claims recorded.", "لا توجد مطالبات.")}</p>
          )}
        </>
      )}
      {p.id === "stockroom" && (
        <>
          <h3>{t("Stock movement ledger", "دفتر حركة المخزون")}</h3>
          {[...d.movements].reverse().map((m: any, i: number) => (
            <div className="ledger-row" key={i}>
              <span>
                {m.reference}
                <small>{fmtDate(m.at, lang, true)}</small>
              </span>
              <b className={m.kind === "issue" ? "danger-text" : ""}>
                {m.kind === "issue" ? "−" : "+"}
                {m.quantity}
              </b>
            </div>
          ))}
        </>
      )}
      {p.id === "fairshare" && (
        <>
          <h3>
            {d.kind === "settlement"
              ? t("Recorded transfer", "تحويل مسجل")
              : t("Equal split", "تقسيم متساوٍ")}
          </h3>
          {d.people.map((name: string, i: number) => (
            <div className="ledger-row" key={name}>
              <span>{name}</span>
              <b>
                {cash(
                  d.kind === "settlement"
                    ? d.amount
                    : Math.floor(d.amount / d.people.length) +
                        (i < d.amount % d.people.length ? 1 : 0),
                  lang,
                )}
              </b>
            </div>
          ))}
        </>
      )}
      {p.id === "recall" && (
        <div className="study-surface">
          {reveal ? (
            <>
              <div className="answer">{d.answer}</div>
              {Date.parse(d.dueAt) <= +now ? (
                <>
                  <p>
                    {t("How well did you remember?", "افتكرت الإجابة قد إيه؟")}
                  </p>
                  <div className="grade-buttons">
                    {[
                      ["again", "Again", "تاني"],
                      ["hard", "Hard", "صعب"],
                      ["good", "Good", "جيد"],
                      ["easy", "Easy", "سهل"],
                    ].map(([grade, en, ar]) => (
                      <button
                        key={grade}
                        disabled={busy}
                        onClick={() => act("review", { grade })}
                      >
                        {t(en, ar)}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p>
                  {t(
                    "Review saved. This card will return on its next due date.",
                    "تم تسجيل المراجعة. البطاقة هترجع في موعدها التالي.",
                  )}
                </p>
              )}
            </>
          ) : (
            <button className="primary" onClick={() => setReveal(true)}>
              {t("Reveal answer", "إظهار الإجابة")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
