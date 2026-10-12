import { z } from "zod";
import {
  c,
  text,
  note,
  date,
  money,
  after,
  metric,
  cash,
  fail,
  type Project,
} from "../../src/contracts";
export const warrantyvault: Project = {
  id: "warrantyvault",
  name: "WarrantyVault",
  arabic: "ضمانك",
  kind: "desktop",
  color: "#745878",
  mark: "07",
  tagline: c(
    "Keep the proof. Know the date.",
    "احفظ التفاصيل، واعرف موعد الضمان.",
  ),
  problem: c(
    "Keep purchase details, serial numbers, warranty deadlines, and claim progress in a private local database.",
    "احفظ بيانات الشراء والأرقام التسلسلية ومواعيد الضمان ومتابعة المطالبات في قاعدة محلية.",
  ),
  entity: c("items", "أجهزة"),
  createLabel: c("Protect a purchase", "إضافة مشتريات"),
  fields: [
    { key: "title", label: c("Product", "المنتج"), required: true },
    { key: "retailer", label: c("Retailer", "البائع"), required: true },
    {
      key: "serial",
      label: c("Serial / receipt reference", "رقم تسلسلي / مرجع الفاتورة"),
      required: true,
    },
    {
      key: "purchasedAt",
      label: c("Purchase date", "تاريخ الشراء"),
      type: "date",
      required: true,
    },
    {
      key: "expiresAt",
      label: c("Warranty ends", "انتهاء الضمان"),
      type: "date",
      required: true,
    },
    {
      key: "price",
      label: c("Purchase price · EGP", "سعر الشراء · جنيه"),
      type: "money",
      required: true,
    },
    {
      key: "notes",
      label: c(
        "Warranty terms / receipt location",
        "شروط الضمان / مكان الفاتورة",
      ),
      type: "textarea",
    },
  ],
  schema: z
    .object({
      title: text,
      retailer: text,
      serial: text,
      purchasedAt: date,
      expiresAt: date,
      price: money,
      notes: note,
    })
    .strict(),
  create: (d, n) => {
    if (d.expiresAt < d.purchasedAt) fail("invalid_dates");
    if (d.purchasedAt > n.toISOString().slice(0, 10)) fail("future_purchase");
    return { ...d, status: "covered", claims: [] };
  },
  act: (d, a, p, n) => {
    if (a === "claim") {
      if (d.status === "claiming") fail("invalid_transition");
      if (d.expiresAt < n.toISOString().slice(0, 10)) fail("expired");
      const { reference } = z.object({ reference: text }).strict().parse(p);
      return {
        ...d,
        status: "claiming",
        claims: [
          ...d.claims,
          { reference, openedAt: n.toISOString(), status: "open" },
        ],
      };
    }
    if (a === "resolve" && d.status === "claiming") {
      const { outcome } = z.object({ outcome: text }).strict().parse(p);
      return {
        ...d,
        status: "covered",
        claims: d.claims.map((x: any) =>
          x.status === "open"
            ? { ...x, status: "resolved", outcome, resolvedAt: n.toISOString() }
            : x,
        ),
      };
    }
    return fail("invalid_transition");
  },
  actions: [
    {
      id: "claim",
      label: c("Open a claim", "فتح مطالبة"),
      fields: [
        {
          key: "reference",
          label: c("Claim reference / issue", "رقم المطالبة / المشكلة"),
          required: true,
        },
      ],
      when: (d) => d.status !== "claiming",
    },
    {
      id: "resolve",
      label: c("Resolve claim", "إنهاء المطالبة"),
      fields: [
        {
          key: "outcome",
          label: c("Resolution", "نتيجة المطالبة"),
          required: true,
        },
      ],
      when: (d) => d.status === "claiming",
    },
  ],
  title: (d) => d.title,
  subtitle: (d) => `${d.retailer} · ${d.serial}`,
  status: (d, n) =>
    d.status === "claiming"
      ? "claiming"
      : d.expiresAt < n.toISOString().slice(0, 10)
        ? "expired"
        : "covered",
  statuses: {
    covered: c("In warranty", "داخل الضمان"),
    claiming: c("Claim open", "مطالبة مفتوحة"),
    expired: c("Expired", "منتهي"),
  },
  metrics: (r, n, lang = "en") => [
    metric(
      "Protected purchases",
      "مشتريات في الضمان",
      r.filter((x) => x.data.expiresAt >= n.toISOString().slice(0, 10)).length,
      "Based on entered warranty dates",
      "حسب التواريخ المسجلة",
    ),
    metric(
      "Expiring in 30 days",
      "تنتهي خلال ٣٠ يوم",
      r.filter(
        (x) =>
          x.data.expiresAt >= n.toISOString().slice(0, 10) &&
          x.data.expiresAt <= after(n, 30),
      ).length,
      "Plan before the deadline",
      "تابع قبل انتهاء الضمان",
    ),
    metric(
      "Purchase value",
      "قيمة المشتريات",
      cash(
        r.reduce((s, x) => s + x.data.price, 0),
        lang,
      ),
      "Recorded purchase prices",
      "أسعار الشراء المسجلة",
    ),
  ],
  seed: (n) => [
    {
      title: "Laptop · everyday workstation",
      retailer: "City Electronics",
      serial: "DEMO-LT-204",
      purchasedAt: after(n, -340),
      expiresAt: after(n, 25),
      price: 3200000,
      notes: "Receipt stored in Documents/Receipts.",
      status: "covered",
      claims: [],
    },
    {
      title: "Wireless headphones",
      retailer: "Audio Store",
      serial: "DEMO-HP-018",
      purchasedAt: after(n, -60),
      expiresAt: after(n, 305),
      price: 180000,
      notes: "",
      status: "covered",
      claims: [],
    },
  ],
};
