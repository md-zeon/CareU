import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations("Home");
  return (
    <main>
      <h1>{t("title")}</h1>
      <div className="h-screen">
        <h1>Section 1</h1>
      </div>
      <div className="h-screen">
        <h1>Section 2</h1>
      </div>
      <div className="h-screen">
        <h1>Section 3</h1>
      </div>
      <div className="h-screen">
        <h1>Section 4</h1>
      </div>
      <div className="h-screen">
        <h1>Section 5</h1>
      </div>
    </main>
  );
}
