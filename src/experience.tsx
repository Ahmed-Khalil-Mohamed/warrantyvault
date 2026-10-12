import { useState, type ReactNode } from "react";
import {
  Plus,
  Scales,
  ArrowRight,
  ArrowUpRight,
  CheckCircle,
  FolderOpen,
  FileText,
  Wrench,
  ShieldCheck,
  Package,
  Receipt,
  Cards,
  MapPin,
  Clock,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import {
  type Project,
  type Entry,
  type Lang,
  type Action,
  cash,
} from "./contracts";
import { Status, fmtDate } from "./components";
type Slots = {
  p: Project;
  now: Date;
  create: () => void;
  notices: ReactNode;
  metrics: ReactNode;
  features: ReactNode;
  records: ReactNode;
  lang: Lang;
};
type Props = {
  p: Project;
  rows: Entry[];
  lang: Lang;
  now: Date;
  busy: boolean;
  open: (e: Entry) => void;
  action: (e: Entry, a: Action) => void;
};
const words = (lang: Lang) => (en: string, ar: string) =>
  lang === "ar" ? ar : en;
function Title({ e, p, open }: Pick<Props, "p" | "open"> & { e: Entry }) {
  return (
    <button className="record-title" dir="auto" onClick={() => open(e)}>
      {p.title(e.data)}
      <ArrowUpRight size={17} />
    </button>
  );
}
function Next({ e, p, lang, busy, action }: Props & { e: Entry }) {
  const a = p.actions.find((a) => a.when(e.data));
  return a ? (
    <button
      className="secondary compact"
      disabled={busy}
      onClick={() => action(e, a)}
    >
      {a.label[lang]}
      <ArrowRight size={14} />
    </button>
  ) : null;
}
function Scene({ label }: { label: string }) {
  return (
    <figure className="brand-scene">
      <img src="/brand-scene.png" alt="" />
      <figcaption>{label}</figcaption>
    </figure>
  );
}

export function ProductComposition({
  p,
  now,
  create,
  notices,
  metrics,
  features,
  records,
  lang,
}: Slots) {
  const t = words(lang);
  return (
    <div className="experience">
      <div className="vault-welcome" id="overview">
        <div>
          <span className="overline">
            {t("YOUR PERSONAL COLLECTION", "مقتنياتك في مكان واحد")}
          </span>
          <h1>
            {t(
              "Keep the things. Keep the peace.",
              "مقتنياتك محفوظة. بالك مرتاح.",
            )}
          </h1>
          <p>
            {t(
              "Receipts, coverage and claims. All together.",
              "مشترياتك وضماناتك ومطالباتك. مع بعض.",
            )}
          </p>
        </div>
        <ShieldCheck size={110} weight="duotone" />
      </div>
      <div className="vault-overview">
        {metrics}
        <button className="primary" onClick={create}>
          <Plus />
          {p.createLabel[lang]}
        </button>
      </div>
      {records}
      {features}
      <div className="workspace-notes">{notices}</div>
    </div>
  );
}
export function ProductRecords(props: Props) {
  const { p, rows, lang, now, busy, open, action } = props;
  const t = words(lang);
  return (
    <div className="purchase-wallet">
      {rows.map((e) => {
        const days = Math.max(
          0,
          Math.ceil(
            (Date.parse(e.data.expiresAt + "T23:59:59") - +now) / 86400000,
          ),
        );
        const total = Math.max(
          1,
          Date.parse(e.data.expiresAt) - Date.parse(e.data.purchasedAt),
        );
        const left = Math.max(
          0,
          Math.min(100, ((Date.parse(e.data.expiresAt) - +now) / total) * 100),
        );
        return (
          <article className="record-card purchase-passport" key={e.id}>
            <div className="passport-cover">
              <div>
                <ShieldCheck size={24} />
                <span>{t("WARRANTY RECORD", "سجل الضمان")}</span>
                <Status project={p} entry={e} lang={lang} now={now} />
              </div>
              <Title {...props} e={e} />
              <code>
                {e.data.serial || t("No serial number", "بدون رقم تسلسلي")}
              </code>
            </div>
            <div className="passport-body">
              <div className="passport-retailer">
                <span>{t("Purchased from", "تم الشراء من")}</span>
                <strong>{e.data.retailer}</strong>
                <small>
                  {fmtDate(e.data.purchasedAt, lang)} ·{" "}
                  {cash(e.data.price, lang)}
                </small>
              </div>
              <div className="coverage-time">
                <strong>{days}</strong>
                <span>{t("days remaining", "يوم متبقي")}</span>
              </div>
              <div className="coverage-track">
                <i style={{ width: left + "%" }} />
              </div>
              <footer>
                <span>
                  {t("Expires", "ينتهي")} {fmtDate(e.data.expiresAt, lang)}
                </span>
                <Next {...props} e={e} />
              </footer>
            </div>
          </article>
        );
      })}
    </div>
  );
}
