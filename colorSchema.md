# Omni-Extension UI & Color Schema Migration Guide

> **Instructions for the AI Agent:**
> You are tasked with upgrading the UI of any component or page in this repository to match the modernized **Dark Slate & Inset Well** design system.
> Follow the strict color tokens, container structures, typography rules, and interactive patterns specified in this document. Detect legacy styles and systematically replace them with the exact Tailwind CSS classes and React patterns defined below.

---

## 1. Core Design System Rules & Constraints

1. **Strict 4-Tier Surface Depth**: Never use flat `#18181b`, `#27272a`, or generic zinc backgrounds for primary cards. Every card must follow the nested container hierarchy:
   - Root Canvas: `#0b0c16`
   - Card Containers: Gradient `from-[#1b1e32] to-[#141626]`
   - Inset Control Wells: Solid `#0f111e` with inner shadow
   - Interactive Chips & Action Badges: `#141626`
2. **Typography Rule — Strictly `font-sans`**:
   - **NEVER** use `font-mono` on numerals, badges, counters, percentages, resolution labels, or slider readouts.
   - Monospace causes slashed zeros (`0̸`), which looks like an IDE or terminal rather than a polished consumer product.
   - Always use `font-sans` with `tabular-nums` for numeric readouts so zeros render as clean, open ovals (`0`) while maintaining fixed-width columnar alignment.
3. **No Flashing Hover Effects**:
   - Do not brighten whole card layouts or overlays on hover.
   - Default states must already have high contrast and brightness. Hover states should only apply subtle border refinement (`hover:border-zinc-500`) and slight shadow elevation.
4. **Zero-Motion Mount / Navigation**:
   - Toggles and interactive controls must NEVER slide or transition color when mounting or when navigating between pages. Animation is strictly reserved for deliberate user clicks.

---

## 2. Global Color Palette & Surface Tokens

### Surface Hierarchy
| Level | Hex / Value | Tailwind Classes | Description / Usage |
|---|---|---|---|
| **Tier 0: Canvas** | `#0b0c16` | `bg-[#0b0c16]` | Base page canvas & inactive toggle backgrounds |
| **Tier 1: Card Container** | `#1b1e32` → `#141626` | `bg-linear-to-b from-[#1b1e32] to-[#141626]` | Outer configuration cards, sections, hero banners |
| **Tier 2: Inset Well** | `#0f111e` | `bg-[#0f111e]` | Nested control wells, slider containers, input rows |
| **Tier 3: Floating / Chips** | `#141626` | `bg-[#141626] hover:bg-[#232742]` | Preset chips, sub-action buttons, dropdown pills |

### Border & Elevation Tokens
- **Card Container**: `border border-zinc-700/80 ring-1 ring-white/10 shadow-xl shadow-black/60 rounded-2xl p-6`
- **Inset Control Well**: `border border-zinc-700/80 rounded-xl p-4.5 shadow-inner`
- **Subtle Dividers**: `border-zinc-700/70` or `border-white/10` (for preview overlays)
- **Active / Focused Border**: `border-zinc-500` or module accent border

---

## 3. Brand Module Accents

When styling module-specific badges, icons, slider tracks, or action buttons, use these dedicated color tokens:

| Module | Primary Hex | Tailwind Text / Border / Bg Classes |
|---|---|---|
| **YouTube** | `#ef4444` | `text-red-400`, `border-red-500/35`, `bg-red-500/20` |
| **InstaGrab** | `#ec4899` | `text-fuchsia-400`, `border-fuchsia-500/35`, `bg-fuchsia-500/20` |
| **Pinterest** | `#e11d48` | `text-rose-400`, `border-rose-500/35`, `bg-rose-500/20` |
| **Timers / Bypasser** | `#10b981` | `text-emerald-400`, `border-emerald-500/35`, `bg-emerald-500/20` |
| **VPN** | `#0ea5e9` | `text-sky-400`, `border-sky-500/35`, `bg-sky-500/20` |
| **VideoGrab** | `#a855f7` | `text-purple-400`, `border-purple-500/35`, `bg-purple-500/20` |

---

## 4. UI Component Architecture & Code Templates

### 4.1. Standard Card Container (Tier 1)
Use this template for all top-level module setting cards:

```jsx
<div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-6 shadow-xl shadow-black/60 space-y-6">
  {/* Card Header */}
  <div className="flex items-center justify-between border-b border-zinc-700/70 pb-4">
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/20 text-red-300 border border-red-500/35 shadow-sm">
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <h3 className="text-base font-extrabold text-white tracking-tight">Feature Title</h3>
        <p className="text-xs text-zinc-300 font-normal mt-0.5">Feature description text</p>
      </div>
    </div>
    
    {/* Status / Count Badge */}
    <span className="text-[10px] bg-red-500/20 text-red-200 border border-red-500/35 px-2.5 py-0.5 rounded-md font-sans font-bold uppercase tracking-wider shadow-sm">
      Active
    </span>
  </div>

  {/* Card Body with Nested Inset Wells */}
  <div className="space-y-4">
    {/* Inset Control Wells go here */}
  </div>
</div>
```

---

### 4.2. Inset Control Well / Toggle Row (Tier 2)
Use this template for any toggle row, dropdown selector, or parameter control:

```jsx
<div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
  <div className="space-y-1">
    <div className="flex items-center gap-2">
      <h4 className="text-sm font-bold text-white flex items-center gap-2">
        <Icon className="w-4 h-4 text-red-400" />
        <span>Control Label</span>
      </h4>
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-sans border ${
        enabled
          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
          : "bg-zinc-800 text-zinc-400 border-zinc-700/80"
      }`}>
        {enabled ? "Active" : "Disabled"}
      </span>
    </div>
    <p className="text-xs text-zinc-300 font-normal leading-relaxed">
      Detailed explanation of what this toggle or control modifies.
    </p>
  </div>

  <Toggle enabled={enabled} onChange={handleToggle} />
</div>
```

---

### 4.3. Standardized Slider Well (Range Inputs)
Use this template for calibration sliders (volume, sensitivity, brightness, contrast, temperature):

```jsx
<div className="group rounded-xl bg-[#0f111e] border border-zinc-700/80 p-5 shadow-inner transition-all duration-200 hover:border-zinc-600">
  <div className="mb-4 flex items-start justify-between gap-3">
    <div className="flex gap-3 min-w-0">
      <div
        className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700/80 text-lg shadow-sm"
        style={{ background: `${accentColor}18`, boxShadow: `0 0 16px ${accentColor}20` }}
      >
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-white text-sm leading-tight">{title}</h4>
        <p className="mt-0.5 text-xs text-zinc-300 leading-relaxed font-normal">{description}</p>
      </div>
    </div>

    {/* Numeric Readout Badge - STRICTLY font-sans tabular-nums */}
    <span
      className="rounded-lg px-2.5 py-1 text-xs font-sans font-extrabold tabular-nums border shadow-sm"
      style={{ background: `${accentColor}18`, color: accentColor, borderColor: `${accentColor}40` }}
    >
      {value}{unit}
    </span>
  </div>

  {/* Custom Range Track */}
  <div className="relative flex items-center" style={{ height: "20px" }}>
    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-zinc-800" />
    <div
      className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full pointer-events-none transition-all duration-75"
      style={{
        width: `${percentage}%`,
        background: `linear-gradient(90deg, ${trackColor}90, ${trackColor})`,
        boxShadow: `0 0 10px ${trackColor}55`,
      }}
    />
    <div
      className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 pointer-events-none transition-all duration-75 z-10"
      style={{
        left: `calc(${percentage}% - 8px)`,
        borderColor: accentColor,
        background: "#18181b",
        boxShadow: `0 0 12px ${accentColor}70, 0 2px 6px rgba(0,0,0,0.8)`,
      }}
    />
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      className="absolute inset-0 w-full cursor-pointer z-20 opacity-0"
    />
  </div>

  {/* Min / Max Labels */}
  <div className="mt-2.5 flex justify-between text-[10px] text-zinc-400 font-sans">
    <span>{min}{unit}</span>
    <span className="text-zinc-500 font-medium">Default: {defaultValue}{unit}</span>
    <span>{max}{unit}</span>
  </div>
</div>
```

---

### 4.4. Toggle Behavior & Component Implementation (`src/components/ui/Toggle.jsx`)
Ensure `Toggle.jsx` strictly suppresses initial mount/page-return animations:

```jsx
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function Toggle({ enabled, onChange }) {
  const [hasInteracted, setHasInteracted] = useState(false);
  const isInitialMount = useRef(true);
  const prevEnabled = useRef(enabled);

  useEffect(() => {
    const timer = setTimeout(() => {
      isInitialMount.current = false;
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (prevEnabled.current !== enabled) {
      if (!isInitialMount.current) {
        setHasInteracted(true);
      }
      prevEnabled.current = enabled;
    }
  }, [enabled]);

  const handleClick = (e) => {
    e.stopPropagation();
    setHasInteracted(true);
    if (onChange) onChange();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Toggle module"
      aria-checked={enabled}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border focus:outline-none ${
        hasInteracted ? "transition-colors duration-300 ease-in-out" : "transition-none"
      } ${
        enabled
          ? "bg-emerald-500 shadow-md shadow-emerald-500/30 border-emerald-400/50"
          : "bg-[#0b0c16] border-zinc-700/80 hover:border-zinc-600"
      }`}
    >
      <motion.span
        initial={false}
        animate={{ x: enabled ? 20 : 0 }}
        transition={
          hasInteracted
            ? { type: "spring", stiffness: 500, damping: 30 }
            : { duration: 0 }
        }
        className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0"
      />
    </button>
  );
}
```

---

## 5. Step-by-Step Migration Checklist for Any Page/Component

When updating an existing component to this color schema, execute the following transformations:

- [ ] **Step 1: Replace Root and Outer Containers**
  - Replace `bg-zinc-900`, `bg-[#18181b]`, or generic gray boxes with:
    `rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-6 shadow-xl shadow-black/60`
- [ ] **Step 2: Replace Nested Control Rows & Boxes**
  - Replace flat gray or zinc inner rows with the `#0f111e` inset well:
    `rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 shadow-inner`
- [ ] **Step 3: Remove All `font-mono` Occurrences**
  - Search for `font-mono` across the file.
  - Replace with `font-sans font-bold tabular-nums` or `font-sans font-semibold`.
  - Verify numerals render with circular open zeros (`0`), never slashed zeros (`0̸`).
- [ ] **Step 4: Standardize Action Buttons & Secondary Chips**
  - Replace plain buttons with:
    `bg-[#141626] hover:bg-[#232742] text-zinc-300 hover:text-white border border-zinc-700/80 px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-colors shadow-sm`
- [ ] **Step 5: Neutralize Preview Overlay Dividers**
  - For image or video overlay mockups, remove colored dividing borders. Use neutral `border-white/10` or `border-zinc-700/70`.
  - Shift accent borders strictly to interactive selection cards.
- [ ] **Step 6: Remove Hover Brightness Flashes**
  - Remove classes like `hover:brightness-125` or `group-hover:bg-white/10` that cause harsh white flashes.
  - Rely on `hover:border-zinc-500` and `transition-[border-color,box-shadow]` instead.
- [ ] **Step 7: Header & Back Button Alignment**
  - If working on an inner feature panel, ensure the global top navbar is not duplicated.
  - Place a clean back button (`[← Dashboard]`) directly in the feature header.
- [ ] **Step 8: Run Linter & Build Verification**
  - Execute `npx eslint <target_file>` to verify 0 syntax/lint errors.
  - Execute `npm run build` to verify clean compilation.
