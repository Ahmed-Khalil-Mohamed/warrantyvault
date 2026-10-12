import { z } from "zod";
export type Lang = "en" | "ar";
export type Copy = { en: string; ar: string };
export const c = (en: string, ar: string): Copy => ({ en, ar });
// Domain documents are validated by each project's Zod schema before persistence.
export type Data = Record<string, any>;
export interface Entry {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  data: Data;
}
export interface Field {
  key: string;
  label: Copy;
  type?:
    | "text"
    | "textarea"
    | "number"
    | "money"
    | "date"
    | "datetime-local"
    | "select";
  options?: { value: string; label: Copy }[];
  required?: boolean;
  min?: number;
  max?: number;
  hint?: Copy;
  default?: string | number;
}
export interface Action {
  id: string;
  label: Copy;
  fields?: Field[];
  when: (d: Data) => boolean;
}
export interface Metric {
  label: Copy;
  value: string | number;
  note: Copy;
}
export interface Project {
  id: string;
  name: string;
  arabic: string;
  kind: "web" | "desktop";
  color: string;
  mark: string;
  tagline: Copy;
  problem: Copy;
  entity: Copy;
  createLabel: Copy;
  fields: Field[];
  schema: z.ZodType<any>;
  create: (input: any, now: Date) => Data;
  act: (data: Data, action: string, payload: any, now: Date) => Data;
  actions: Action[];
  title: (d: Data) => string;
  subtitle: (d: Data, lang: Lang) => string;
  status: (d: Data, now: Date) => string;
  statuses: Record<string, Copy>;
  metrics: (entries: Entry[], now: Date, lang?: Lang) => Metric[];
  seed: (now: Date) => Data[];
}
export class DomainError extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}
export const fail = (code: string): never => {
  throw new DomainError(code);
};
export const text = z.string().trim().min(1).max(300);
export const note = z.string().trim().max(3000).default("");
export const money = z.number().int().min(1).max(100_000_000);
export const count = z.number().int().min(1).max(100_000);
export const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      Number.isFinite(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
  );
export const datetime = z.string().datetime({ offset: true });
export const isoDay = (now: Date) => now.toISOString().slice(0, 10);
export const after = (now: Date, days: number) =>
  new Date(now.getTime() + days * 86400000).toISOString().slice(0, 10);
export const cash = (cents: number | bigint, lang: Lang = "en") => {
  const locale = lang === "ar" ? "ar-EG" : "en-US";
  const format = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EGP",
  });
  if (typeof cents === "number") return format.format(cents / 100);
  const absolute = cents < 0n ? -cents : cents,
    major = absolute / 100n;
  const signed = cents < 0n ? (major === 0n ? -0 : -major) : major;
  const fraction = new Intl.NumberFormat(locale, {
    minimumIntegerDigits: 2,
    useGrouping: false,
  }).format(Number(absolute % 100n));
  return format
    .formatToParts(signed)
    .map((part) => (part.type === "fraction" ? fraction : part.value))
    .join("");
};
export const metric = (
  en: string,
  ar: string,
  value: string | number,
  noteEn: string,
  noteAr: string,
): Metric => ({ label: c(en, ar), value, note: c(noteEn, noteAr) });
export const option = (value: string, en: string, ar: string) => ({
  value,
  label: c(en, ar),
});
export const move = (
  d: Data,
  action: string,
  transitions: Record<string, string>,
  now: Date,
): Data => {
  const target = transitions[`${d.status}:${action}`];
  if (!target) fail("invalid_transition");
  return { ...d, status: target, changedAt: now.toISOString() };
};
