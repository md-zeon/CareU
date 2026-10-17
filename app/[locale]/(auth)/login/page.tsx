import { getTranslations } from "next-intl/server";

/** Placeholder for sign-in (Better Auth phone + OTP). */
export default async function LoginPage() {
  const t = await getTranslations("Pages");
  const placeholder = await getTranslations("Placeholder");

  return (
    <div className="w-full max-w-sm text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{t("login")}</h1>
      <p className="mt-2 text-muted-foreground">{placeholder("message")}</p>
    </div>
  );
}
