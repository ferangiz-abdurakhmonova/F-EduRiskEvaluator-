# Interactive Risk Card Selection & Form Sync Improvement

Enhance the Risk Assessment Registry card selection state in `Dashboard.tsx` and the Risk Form strip in `RiskForm.tsx` so clicking any card immediately updates the selected card's color/glow state and loads its data into the evaluation form.

## User Review & Critical Decisions

> [!IMPORTANT]
> The user confirmed that clicking a risk card should:
> 1. Visually highlight the card with a vibrant cyan border, soft background tint, and active focus glow matching the user's reference screenshot (`image_6b500324.png`).
> 2. Automatically load the selected risk's details into the Risk Evaluation Form (`activeTab = 'form'`).

- **Confirmed Choice 1**: Card click behavior — Clicking anywhere on a card highlights it and automatically loads its data into the Risk Assessment Form.
- **Confirmed Choice 2**: Visual styling — Vibrant cyan border (`border-2 border-cyan-400`), soft light cyan background tint (`bg-cyan-50/90 dark:bg-cyan-950/40`), and active ring highlight (`ring-2 ring-cyan-400/40`).

---

## 1. Overview & Core Concept

- **What It Does**: Makes every risk card in the Risk Assessment Registry (`Dashboard.tsx`) clickable. Clicking a card changes its visual border and fill to a clear, high-contrast active state and switches the view directly to the Risk Evaluation Form populated with that risk's fields.
- **Target Audience / Persona**: Students and instructors conducting risk evaluations in the academic simulation environment.
- **Key Value**: Eliminates user confusion by making selection feedback instantaneous, intuitive, and visually distinct.

---

## 2. User Experience & Visual Design

- **Card Selection Feedback**:
  - **Selected State**: 2px rounded cyan border (`border-2 border-cyan-400 dark:border-cyan-400`), subtle light cyan background fill (`bg-cyan-50/90 dark:bg-cyan-950/40`), outer soft shadow glow (`shadow-md shadow-cyan-500/10`), and ring highlight (`ring-2 ring-cyan-400/40`).
  - **Unselected State**: Hairline slate border (`border-slate-200 dark:border-slate-800`), neutral surface (`bg-white dark:bg-slate-950/60`), subtle hover border transition.
  - **Entire Card Clickable**: Add `onClick={() => onSelectRisk(risk.id)}` and `cursor-pointer` to the entire card element container in `Dashboard.tsx`.
- **Selector Strip Sync in RiskForm**:
  - Ensure the horizontal badge strip in `RiskForm.tsx` also clearly displays active cyan highlighting for the selected item index (`activeRiskIndex`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Make Entire Risk Card Clickable**:
  - *Chosen Approach*: Wrap/bind `onClick` on the entire card `div` in `Dashboard.tsx`, with `e.stopPropagation()` on delete buttons.
  - *Why*: Users expect to click anywhere on a card to select it, rather than searching for tiny icon buttons.
- **Decision 2: Automatic Navigation to Form View**:
  - *Chosen Approach*: Invoking `onSelectRisk(risk.id)` highlights the card, updates `activeRiskIndex`, and automatically switches `activeTab` to `'form'`.
  - *Why*: Direct seamless workflow for inspecting and editing the selected risk item.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      App Component (App.tsx)                │
│  State: risks[], activeRiskIndex, activeTab ('form'|'dash')  │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌───────────────────────────┐
│     Dashboard.tsx            │ │      RiskForm.tsx         │
│  - Interactive Cards View    │ │  - Selected Risk Editor   │
│  - Click card ->             │ │  - Active Badge Strip     │
│    onSelectRisk(risk.id)     │ │  - Word Progress Rings    │
│  - Selected cyan glow border │ │  - Anti-paste validation  │
└──────────────────────────────┘ └───────────────────────────┘
```

### Component & State Changes

1. **`src/components/Dashboard.tsx`**:
   - Bind `onClick={() => onSelectRisk(risk.id)}` to the card container `div` with `cursor-pointer hover:shadow-md transition-all`.
   - Add `e.stopPropagation()` to the `Trash2` (Delete) button click handler so deleting a card doesn't accidentally trigger selection.
   - Update card selected styling to use `border-2 border-cyan-400 dark:border-cyan-400 bg-cyan-50/90 dark:bg-cyan-950/40 shadow-md shadow-cyan-500/10 ring-2 ring-cyan-400/40`.
2. **`src/components/RiskForm.tsx`**:
   - Verify risk selector badge strip styling in `RiskForm.tsx` matches the clean cyan active state.

---

## 5. Verification Plan

- Click risk cards in Cards View of Dashboard tab to verify visual active selection (cyan border and tint).
- Confirm automatic tab transition to Risk Assessment Form showing the selected risk details.
- Run `compile_applet` to verify compilation without errors.
