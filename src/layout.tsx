import type { ReactNode } from "react";
import {
  UsersThree,
  ListBullets,
  CalendarBlank,
  HandHeart,
  Package,
  ChartBar,
  Cards,
} from "@phosphor-icons/react";
import type { Lang } from "./contracts";
export function ProductLayout({
  brand,
  utilities,
  lang,
  children,
}: {
  brand: ReactNode;
  utilities: ReactNode;
  lang: Lang;
  children: ReactNode;
}) {
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);
  return (
    <div className="vault-shell">
      <header className="vault-nav">
        {brand}
        <nav>
          <a href="#overview">{t("My vault", "خزنتي")}</a>
          <a href="#records">{t("Purchases", "المشتريات")}</a>
        </nav>
        {utilities}
      </header>
      <main className="identity-main">{children}</main>
    </div>
  );
}
