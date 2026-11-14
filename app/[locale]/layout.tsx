// src/app/[locale]/layout.tsx
import "@/app/globals.css";
import { locale as getRootLocale } from "next/root-params";
import { Hind_Siliguri, Inter } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { AbstractIntlMessages } from "next-intl";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { routing } from "@/lib/i18n/routing";
import { PrototypeSessionProvider } from "@/lib/prototype/session";
import { PrototypeChrome } from "@/components/prototype/PrototypeChrome";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");

  return {
    title: {
      default: t("title"),
      template: `%s | ${t("title")}`,
    },
    description: t("description"),
  };
}

type LocaleLayoutProps = {
  children: ReactNode;
};

export default async function LocaleLayout({ children }: LocaleLayoutProps) {
  const locale = await getRootLocale();

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = (await import(`@/lib/i18n/messages/${locale}.json`)).default as AbstractIntlMessages & {
    PrototypeAccess?: AbstractIntlMessages;
  };
  const prototypeMessages = {
    PrototypeAccess: messages.PrototypeAccess ?? {},
  };

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${hindSiliguri.variable}`}
    >
      <body>
        <NextIntlClientProvider locale={locale} messages={prototypeMessages}>
          <PrototypeSessionProvider>
            {children}
            <PrototypeChrome />
          </PrototypeSessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
