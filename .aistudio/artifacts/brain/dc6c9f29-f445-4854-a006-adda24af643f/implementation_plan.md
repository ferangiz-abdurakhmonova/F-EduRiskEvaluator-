# Implementation Plan - Soft Indigo-Cyan Accent Buttons

Update the primary blue active buttons across the app with a sleek, vibrant soft indigo-cyan gradient finish (`from-indigo-600 to-cyan-600`), paired with high-contrast crisp white typography and a refined dark badge background.

## User Choice
- **Visual Direction**: Soft Indigo-Cyan Accent Buttons

## Key Changes
1. **View Switcher Tabs (`src/App.tsx`)**
   - Update active view tab buttons (`Risk Assessment Form`, `Analytics Dashboard`, `Live Class Stream`) from flat cyan to `bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white shadow-md shadow-indigo-500/20`.
   - Maintain clean hover state and border highlights.

2. **Risk Item Badges & Action Buttons (`src/components/RiskForm.tsx`)**
   - **Active Risk Item Pill**: Upgrade active risk item selector to `bg-gradient-to-r from-indigo-600 to-cyan-600 text-white border-indigo-400 shadow-md`.
   - **Active Severity Badge**: Style badge inside active risk item pill with a sleek contrast slate-900 tint (`bg-slate-900/90 text-cyan-200 border border-indigo-400/30`).
   - **`+ Add Risk` Button**: Update button styling to `bg-gradient-to-r from-indigo-600 to-cyan-600 text-white hover:from-indigo-500 hover:to-cyan-500 shadow-md shadow-indigo-500/20`.

3. **Navbar Action Buttons (`src/components/Navbar.tsx`)**
   - **`Submit Report` Button**: Upgrade to `bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-md shadow-indigo-500/25`.

## Verification
- Run `compile_applet` to confirm zero build or lint issues.
- Confirm visual contrast across light and dark theme modes.
