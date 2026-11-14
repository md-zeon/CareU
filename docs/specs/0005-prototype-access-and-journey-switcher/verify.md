# Verify: prototype access and journey switcher · spec 0005 · updated 2026-11-14
_Steps derived from spec 0005 acceptance criteria and value sourcing. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [ ] Open `/en/prototype` and `/bn/prototype` and confirm a floating prototype control is visible on each locale page, clearly labeled as prototype only and not presented as real account or permission UI → AC-1, AC-7
- [ ] Open the panel, close it with the close button, and reopen it with the floating trigger; confirm the panel can be opened and closed without blocking core page navigation on a small screen width → AC-1
- [ ] In the panel, confirm the representative persona set is available with clear labels and short scope descriptions: guest, signed in customer, seller owner, seller staff, CareU shop staff, platform admin, operations or support, and finance or settlements → AC-2
- [ ] Confirm the active mock persona shown in the panel matches the selected persona option (label, kind/scope description) after switching personas → AC-2, AC-6, value sourcing (active persona)
- [ ] Confirm journey shortcuts are grouped by area (general, customer, seller, platform) with localized labels in English and Bangla and links that keep the current locale → AC-3, AC-7, value sourcing (grouped shortcuts, locale links)
- [ ] Activate a planned shortcut (for example seller or admin entry) and confirm it opens a clear placeholder or not yet built state instead of a broken page → AC-3, AC-7
- [ ] With persona set to guest, open `/en/account`, `/en/wishlist`, or `/en/order/track` and confirm a sign in required gate appears instead of protected prototype content → AC-5
- [ ] From the gate, choose an appropriate signed in mock persona (for example signed in customer) and confirm the prototype flow becomes visible without any real authentication or backend call → AC-5, AC-6
- [ ] Select a non guest persona, toggle the panel open, navigate to another route, and refresh the page; confirm the active persona and panel open/closed state are restored → AC-4
- [ ] Set an invalid stored value for key `careu.prototype.session` in browser storage (unknown persona, wrong version, or malformed JSON), reload, and confirm the app falls back safely to the guest persona with no crash → AC-4, value sourcing (default/fallback persona, storage restore)

## Commands
- [ ] `npm run typecheck` passes for the prototype access changes (types/config/provider/gate/routes compile cleanly in a fully installed environment) → AC-6, AC-7
- [ ] `npm run lint` passes for the prototype access changes → AC-7
- [ ] `npm run build` completes successfully and locale routes including the new prototype switcher and placeholder journeys build without errors → AC-1, AC-3, AC-7

## Acceptance-criteria coverage
- AC-1: floating prototype panel available across locale routes, clearly prototype only, open/close behavior and overlay usability
- AC-2: representative persona picker with labels and scope descriptions, active persona display updates on switch
- AC-3: grouped localized journey shortcuts, locale aware navigation, planned routes show clear placeholder/not built state
- AC-4: browser persistence and restore of active persona and panel state, invalid storage falls back to guest
- AC-5: guest sees sign in required gate on protected prototype flows and can continue as signed in mock persona without real auth
- AC-6: shared provider/hook/config/gate drive consistent mock UI state with no real database, API, or server side authorization changes
- AC-7: reuses existing prototype foundations and patterns, next-intl/localized labels, compatible with Facade approach and navigable routes
- Value sourcing coverage: UI labels and persona/shortcut content, active persona resolution, persona option set, stored session key/version/fallback, grouped shortcut targets and locale links, gate inputs and suggested persona choices, root locale mount and prototype only labeling
