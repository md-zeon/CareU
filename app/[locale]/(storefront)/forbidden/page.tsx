import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

export default async function ForbiddenPage() {
  const t = await getTranslations("Authz");
  const pages = await getTranslations("Pages");
  const locale = await getLocale();

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{t("forbiddenTitle")}</h1>
      <p className="mt-3 text-muted-foreground">{t("forbiddenMessage")}</p>
      <Link href={`/${locale}`} className="mt-6 underline underline-offset-4">
        {t("returnHome")}
      </Link>
      <span className="sr-only">{pages("forbidden")}</span>
    </div>
  );
}
