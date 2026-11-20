import type { Locale } from "@/lib/i18n/routing";
import type { LocalizedText } from "@/lib/mock/types";
import { pickText } from "@/components/storefront/home/home-utils";
import { CardContent, CardHeader, CardShell, Section } from "@/components/storefront/primitives";

export function ProductDetailsSection({
  locale,
  title,
  description,
  highlights,
  specifications,
  labels,
}: {
  locale: Locale;
  title: string;
  description: LocalizedText | null;
  highlights: LocalizedText[];
  specifications: { label: LocalizedText; value: LocalizedText }[];
  labels: {
    description: string;
    highlights: string;
    specifications: string;
  };
}) {
  if (!description && highlights.length === 0 && specifications.length === 0) return null;
  return (
    <Section title={title} contentClassName="space-y-4">
      {description ? (
        <CardShell>
          <CardHeader>
            <h3 className="text-base font-semibold">{labels.description}</h3>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">
              {pickText(description, locale)}
            </p>
          </CardContent>
        </CardShell>
      ) : null}
      {highlights.length > 0 ? (
        <CardShell>
          <CardHeader>
            <h3 className="text-base font-semibold">{labels.highlights}</h3>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground sm:text-base">
              {highlights.map((h, i) => (
                <li key={`${h.en}-${i}`}>{pickText(h, locale)}</li>
              ))}
            </ul>
          </CardContent>
        </CardShell>
      ) : null}
      {specifications.length > 0 ? (
        <CardShell>
          <CardHeader>
            <h3 className="text-base font-semibold">{labels.specifications}</h3>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {specifications.map((spec, i) => (
                <div key={`${spec.label.en}-${i}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 border-b pb-3 last:border-b-0 last:pb-0">
                  <dt className="text-sm font-medium text-foreground">{pickText(spec.label, locale)}</dt>
                  <dd className="text-sm text-muted-foreground">{pickText(spec.value, locale)}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </CardShell>
      ) : null}
    </Section>
  );
}
