import { getTranslations } from "next-intl/server";

/** Placeholder for the account overview page. */
export default async function AccountPage() {
  const t = await getTranslations("Pages");
  const placeholder = await getTranslations("Placeholder");

  return (
    <div className="mx-auto max-w-360 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("account")}</h1>
      <p className="mt-2 text-muted-foreground">{placeholder("message")}</p>
    </div>
  );
}
