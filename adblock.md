# Omni Extension — AdShield / AdBlock Module Integration Plan

This document outlines the step-by-step engineering plan to integrate comprehensive ad and tracker blocking capabilities (derived from AdBlock MV3 in [adblock-extension-source](file:///d:/Data/Github/omni-extension/adblock-extension-source)) into **Omni Extension** as a first-class 7th core module.

---

## 1. Executive Summary & Goals

Omni Extension currently provides 6 modules:
1. `videograb` — Stream Sniffer & Downloader
2. `youtube` — Playback, Seek & Color Grading Suite
3. `instagrab` — Instagram Media Downloader & Carousel Compiler
4. `vpn` — Secure Proxy Manager & Failover Engine
5. `timers` — Shortlink Countdown & Redirect Bypasser
6. `pinterest` — Pinterest HD Pin & Video Grabber

We are adding **Module 7: `adblock` (AdShield)** to provide:
* **High-Performance Element Hiding**: Declarative and dynamic CSS cosmetics to collapse ad slots, sponsored tiles, and video ad overlays.
* **YouTube Anti-Adblock Neutralization**: Defuses `ytd-enforcement-message-view-model`, clears interruption toast warnings, and recovers video playback seamlessly.
* **Push Notification Shield**: Disables spammy browser notification request prompts via prototype-level monkey-patching.
* **Cookie Banner & GDPR Notice Neutralizer**: Automatically removes intrusive consent modals on supported websites.
* **Domain Whitelisting & Custom Rules**: Per-site bypass toggles and custom CSS/URL filter rules stored in `chrome.storage.local`.
* **Dark Slate UI Dashboard**: Built according to [colorSchema.md](file:///d:/Data/Github/omni-extension/colorSchema.md) with metric readouts, zero-motion toggles, and inset control wells.

---

## 2. Architecture & Component Blueprint

```rust
┌────────────────────────────────────────────────────────────────────────┐
│                        Dashboard & Popup Surfaces                      │
│  • src/App.jsx: ModuleCard & Lazy Route <AdblockTab />                 │
│  • src/components/adblock/AdblockTab.jsx (Metrics, Toggles, Whitelist) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Central State & Messaging Layer                    │
│  • chrome.storage.local: adblockEnabled, adblockBlockedCount,          │
│    adblockWhitelist, adblockYtBypass, adblockCookieBanner,             │
│    adblockNotifications, adblockCustomRules                            │
│  • src/utils/StorageAdapter.js: Synchronous in-memory caching          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Background Service Worker Hub                       │
│  • src/chrome/background.js: Storage seeding, rule synchronization,    │
│    badge counter updates & tab status dispatch                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Injected Web Content Scripts                       │
│  • src/chrome/adblock/content.js: Injected at document_start           │
│    - CSS Element Hiding & MutationObserver                             │
│    - window.Notification.requestPermission silencer                   │
│    - YouTube anti-adblock message & interruption defuser               │
│    - Cookie consent dialog collapse loop                               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Step-by-Step Implementation Roadmap

### Phase 1: Design Tokens & Module Registry
1. **[src/config/tokens.js](file:///d:/Data/Github/omni-extension/src/config/tokens.js)**:
   * Register `adblock` brand color tokens: Cyan/Teal aesthetic (`#06b6d4`, gradient `from-cyan-500 via-teal-500 to-emerald-600`, border, glow, badge style).
2. **[src/config/modules.js](file:///d:/Data/Github/omni-extension/src/config/modules.js)**:
   * Add `adblock` to `extensionModules` array with icon `🛡️`, name `AdShield`, and category `Privacy & Security`.

### Phase 2: Extension Manifest & Build Configuration
1. **[public/manifest.json](file:///d:/Data/Github/omni-extension/public/manifest.json)**:
   * Add `"declarativeNetRequest"` (or `"declarativeNetRequestWithHostAccess"`) and `"contextMenus"` to `permissions`.
   * Register `adblock.js` in `content_scripts` matching `<all_urls>` at `document_start` with `all_frames: true`.
2. **[vite.config.js](file:///d:/Data/Github/omni-extension/vite.config.js)**:
   * Add `adblock: resolve(import.meta.dirname, "src/chrome/adblock/content.js")` to Rollup `input` and `output.entryFileNames`.

### Phase 3: Content Script Engine ([src/chrome/adblock/content.js](file:///d:/Data/Github/omni-extension/src/chrome/adblock/content.js))
Create a unified, fast content script providing:
1. **Spam Notification Silencer**:
   * Intercepts `window.Notification.requestPermission` at `document_start` to return `"denied"` without prompting the user.
2. **Element Hiding Engine**:
   * Injects hardware-accelerated CSS style hiding common ad selectors (`.adsbygoogle`, `[id^="google_ads"]`, `.sponsored-item`, `[data-ad-unit]`, etc.).
   * Runs an efficient `MutationObserver` on `document.documentElement` to scrub dynamic ad containers as they mount.
3. **YouTube Playback Defense**:
   * Scans for and removes `ytd-enforcement-message-view-model`.
   * Clears video interruption toasts ("Experiencing interruptions?").
   * Automatically bypasses stuck playback by auto-clicking skip buttons and recovering playback time.
4. **Cookie Consent Modal Collapser**:
   * Neutralizes common GDPR overlay dialogs (`#onetrust-consent-sdk`, `.cookie-banner`, `[id*="cookie-notice"]`).
5. **Whitelist Verification**:
   * Reads `adblockWhitelist` from `chrome.storage.local` and instantly deactivates blocking on user-whitelisted domains.

### Phase 4: Background Service Worker Integration ([src/chrome/background.js](file:///d:/Data/Github/omni-extension/src/chrome/background.js))
1. **Storage Initialization**:
   * Seed `activeModules.adblock = true`.
   * Seed defaults: `adblockEnabled: true`, `adblockBlockedCount: 0`, `adblockYtBypass: true`, `adblockCookieBanner: true`, `adblockNotifications: true`, `adblockWhitelist: []`, `adblockCustomRules: ""`.
2. **Message Handlers**:
   * Handle `ADBLOCK_INCREMENT_COUNT`: Updates total blocked ads tally and reflects badge on the active tab.
   * Handle `ADBLOCK_GET_STATUS`: Provides active blocking state for the current tab domain.

### Phase 5: Dashboard Configuration Tab ([src/components/adblock/AdblockTab.jsx](file:///d:/Data/Github/omni-extension/src/components/adblock/AdblockTab.jsx))
Build the dedicated tab interface matching the **Dark Slate & Inset Well** design system:
1. **Stat Metrics Banner**:
   * Total Ads Blocked (`tabular-nums`, cyan gradient icon).
   * Active Shield Status (pulse indicator: `Shield Active`).
   * YouTube Bypass Status (`Armed & Protected`).
2. **Feature Control Cards**:
   * Master Toggle: Enable / Disable AdShield.
   * YouTube Anti-Adblock Defense toggle.
   * Cookie Consent Banner Silencer toggle.
   * Push Notification Spam Blocker toggle.
3. **Domain Whitelist Management**:
   * Current site allowlist status with one-click "Whitelist This Site" button.
   * List of whitelisted domains with trash icon to remove.
4. **Custom Rules / Selectors Editor**:
   * Textarea with syntax hints for adding custom CSS element-hiding rules (`##.banner-ad`) or domain rules.

### Phase 6: App Dashboard Assembly ([src/App.jsx](file:///d:/Data/Github/omni-extension/src/App.jsx))
1. Lazy-load `AdblockTab`:
   ```javascript
   const AdblockTab = React.lazy(() => import("./components/adblock/AdblockTab.jsx"));
   ```
2. Add route inside `<FeaturePanel>` for `currentFeature === "adblock"`.
3. Verify grid layout rendering in Installed Modules.

---

## 4. Verification & Testing Matrix

| Test Case | Verification Method | Expected Outcome |
|---|---|---|
| **Vite Bundle Build** | Run `npm run build` | All chunks transform cleanly; `dist/adblock.js` and `assets/AdblockTab-*.js` output without errors. |
| **Lint Verification** | Run `npm run lint` | Zero lint regressions across newly created components. |
| **Module Toggle** | Toggle AdShield switch in main dashboard | `activeModules.adblock` updates in `chrome.storage.local` with immediate badge update. |
| **Notification Shield** | Test `Notification.requestPermission()` in web console | Resolves silently with `"denied"` without presenting a browser popup. |
| **YouTube Ad Bypass** | Load YouTube watch page with adblock enabled | Video plays uninterrupted; enforcement overlays are blocked. |
| **Whitelist Exemption** | Add a test domain to whitelist in dashboard | Content script skips element hiding on that specific domain. |

---

## 5. Execution Protocol

Per user global automation rules, following the creation of this plan, full execution proceeds immediately to build, assemble, and verify all files in the solution flow.
