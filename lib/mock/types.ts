export type LocalizedText = {
  en: string;
  bn: string;
};

export type MockScenario = "default" | "empty" | "loading" | "error" | "success";

export type ScenarioOptions = {
  scenario?: MockScenario;
};

export type ScenarioResult<T> =
  | { scenario: "default" | "success"; data: T }
  | { scenario: "empty"; data: T }
  | { scenario: "loading"; data: null }
  | { scenario: "error"; data: null; message: LocalizedText };

export type LocalizedIdRef = {
  id: string;
};

export const DEFAULT_SCENARIO: MockScenario = "default";

export function l(en: string, bn: string): LocalizedText {
  return { en, bn };
}

export function resolveScenario(options?: ScenarioOptions): MockScenario {
  return options?.scenario ?? DEFAULT_SCENARIO;
}

export function scenarioError(
  en = "Something went wrong while loading this preview.",
  bn = "এই প্রিভিউ লোড করতে সমস্যা হয়েছে।",
): LocalizedText {
  return l(en, bn);
}

export function withScenario<T>(
  data: T,
  options?: ScenarioOptions & {
    emptyData?: T;
    errorMessage?: LocalizedText;
  },
): ScenarioResult<T> {
  const scenario = resolveScenario(options);
  if (scenario === "loading") return { scenario, data: null };
  if (scenario === "error") {
    return {
      scenario,
      data: null,
      message: options?.errorMessage ?? scenarioError(),
    };
  }
  if (scenario === "empty") {
    return { scenario, data: options?.emptyData ?? ([] as unknown as T) };
  }
  return { scenario, data };
}

export function findById<T extends { id: string }>(items: T[], id: string): T | null {
  return items.find((item) => item.id === id) ?? null;
}

export function findBySlug<T extends { slug: string }>(items: T[], slug: string): T | null {
  return items.find((item) => item.slug === slug) ?? null;
}
