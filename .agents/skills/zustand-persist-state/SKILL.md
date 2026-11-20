---
name: zustand-persist-state
description: >-
  Client state with Zustand: store design, persist to localStorage, rehydration
  guards, schema migrations, and selectors. Use when adding client-side state,
  wizard data persistence, or local-first apps in React/Next.js.
---

# Zustand Persist State

## Install

```bash
npm install zustand
```

## Store shape

```ts
interface AppStore {
  data: AppData;
  currentStep: Step;
  isComplete: boolean;
  setData: (patch: Partial<AppData>) => void;
  setCurrentStep: (step: Step) => void;
  resetAll: () => void;
}
```

Keep actions on the store; components call actions, not `set` directly from UI.

## Persist middleware

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      setData: (patch) => set((s) => ({ data: { ...s.data, ...patch } })),
      resetAll: () => set(initialState),
    }),
    {
      name: "app-storage-key",
      partialize: (s) => ({ data: s.data, currentStep: s.currentStep, isComplete: s.isComplete }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<AppStore>),
        data: normalizeData((persisted as AppStore)?.data ?? current.data),
        currentStep: migrateStep((persisted as AppStore)?.currentStep),
      }),
    }
  )
);
```

## Hydration hook

```tsx
let hydrated = false;
export const useStoreHydrated = () => {
  const [ready, setReady] = useState(hydrated);
  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => {
      hydrated = true;
      setReady(true);
    });
    useStore.persist.rehydrate();
    return unsub;
  }, []);
  return ready;
};
```

Gate routes/UI until `ready` to avoid flash/wrong redirects.

## Migrations

When schema changes:

```ts
function normalizeData(raw: unknown): AppData {
  // coerce missing fields, rename keys, drop deprecated
  return { ...defaults, ...(raw as AppData) };
}

function migrateStep(step: unknown): Step {
  if (typeof step === "string" && VALID_STEPS.includes(step as Step)) return step as Step;
  return "intro";
}
```

Version field optional: `persistedState.version` → switch migration path.

## Selectors

```ts
export const useProfile = () => useStore((s) => s.data.profile);
export const useWizardComplete = () => useStore((s) => s.isComplete);
```

## Import / export (local-first backup)

```ts
export function downloadJsonSnapshot(state: PersistedSnapshot, filename: string) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  // trigger download
}
```

Validate imported JSON with Zod before merging into store.

## Privacy note

localStorage is **plain text** — document in privacy policy; offer export + clear.

## Anti-patterns

- Storing formatted display strings instead of raw numbers/dates
- Whole-store subscription causing global re-renders
- Skipping merge/normalize → broken state after deploy
- Reading localStorage synchronously on first client render before rehydrate

Pair with: `multi-step-wizard-flow`, `react-hooks-patterns`.
