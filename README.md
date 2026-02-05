# Studio Background & Light Theme Revamp

This update introduces a modern **studio-style light theme** across the application, improving visual clarity, usability, and layout structure while preserving existing functionality.

---

## ✨ What This Does

### 🎨 Visual & Theme Updates
- Switches the UI from a dark, glass-heavy aesthetic to a **clean, light studio theme**
- Adds subtle **radial gradient backgrounds** and a **grid texture overlay**
- Improves color contrast and readability across all sections

### 🧱 Layout Improvements
- Refactors the page structure into clear sections:
  - Header
  - Hero
  - Work / Services / Insights
  - Footer
- Introduces a **studio-style hero layout** with editorial typography and metric cards
- Adds a consistent footer with navigation links

### 🧭 Navigation & Header
- Replaces legacy navigation with a responsive **grid-based header**
- Centers primary navigation and separates the primary call-to-action
- Improves mobile responsiveness

### 📝 Forms & Interaction
- Converts dark glass form styles to **light, accessible form cards**
- Improves focus states and input contrast
- Keeps existing form logic unchanged

### ♿ Accessibility Enhancements
- Retains and improves the “Skip to content” link
- Improves focus outlines for keyboard navigation
- Honors `prefers-reduced-motion` for animations

### ⚙️ Code & Maintenance
- Removes legacy `heritage-*` styles
- Consolidates duplicated CSS
- Keeps changes **CSS-only** (no JavaScript behavior changes)
- Safe for static deployment (Cloudflare Pages, Netlify, etc.)

---

## 🧪 Testing

- Verified locally using a static HTTP server
- Deployed successfully to Cloudflare Pages preview
- No runtime errors or layout regressions observed

---

## 📌 Notes

- This is a **visual and structural refactor only**
- No backend or API logic is affected
- Existing HTML may require matching class names for new styles
