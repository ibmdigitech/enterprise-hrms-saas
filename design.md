# UI/UX & Design System Document (design.md)
## Multi-Tenant & Multi-Company Design Architecture

---

## 1. Design Principles

1. **Enterprise Elegance**: Clean, modern, trustworthy aesthetic with subtle glassmorphism, crisp borders, and purposeful micro-interactions.
2. **Context Clarity**: Users must always have immediate visual confirmation of their **Active Tenant**, **Active Company**, and **Active Location/Branch**.
3. **Seamless White-Labeling**: The UI dynamically adapts to the tenant's brand palette (primary color, accent color, logos, font weights) without visual glitches.
4. **Information Density**: Balance data density for HR/Payroll specialists with clean, uncluttered views for regular staff self-service.

---

## 2. Dynamic Theme & Token Architecture

The design system uses Tailwind CSS variables mapped to tenant brand tokens injected dynamically into the HTML root:

```css
:root {
  /* Default Platform Fallbacks */
  --tenant-primary: #1e40af;
  --tenant-primary-hover: #1d4ed8;
  --tenant-accent: #0284c7;
  --tenant-radius: 0.5rem;
  --tenant-font: 'Inter', -apple-system, sans-serif;
}
```

When a tenant configures their workspace, the server layout injects custom values:
```html
<style id="tenant-theme">
  :root {
    --tenant-primary: {tenant.branding.primaryColor};
    --tenant-primary-hover: {tenant.branding.primaryHover};
    --tenant-accent: {tenant.branding.accentColor};
  }
</style>
```

---

## 3. Global Navigation & Context Switcher Components

### 3.1. Top Navigation Bar (Header)
- **Tenant & Company Selector**:
  - Displays `[Tenant Logo] [Tenant Name] / [Company Name] (Dropdown)`.
  - Clicking opens a command-palette style popover allowing users with multi-entity permissions to switch companies or locations instantly.
- **Global Search Bar**: Scoped to the current tenant and company.
- **Notification Bell**: Shows unread alerts scoped to the active tenant.
- **User Profile Menu**:
  - Switch Tenant (if multi-membership).
  - My Profile & Security.
  - Sign Out.

### 3.2. Responsive Sidebar (Navigation)
- **Platform Operations (Only visible to Platform Super Admins)**:
  - Global Overview, Tenants List, Subscriptions, Platform System Logs.
- **Organization Management (Tenant / Company Admins)**:
  - Companies, Locations/Branches, Departments, Roles & Permissions, Branding & Settings.
- **Core HR Modules (All Employees / Managers according to RBAC)**:
  - Employees Directory, Attendance & Shifts, Leaves & Time Off, UAE Payroll & WPS, UAE Visa & Compliance, Letters & Documents, Performance & Offboarding.

---

## 4. UI Components for Multi-Tenancy

1. **Company Badge**: Small chiclet displayed on employee cards and documents indicating the subsidiary entity (`[ABC Trading LLC]`).
2. **Quota Progress Bars**: Displayed in Tenant Admin Settings showing real-time usage (e.g., `42 / 50 Employees Active` with a clean progress bar and "Upgrade Plan" CTA).
3. **Brand Customization Studio**:
   - Live preview panel in Tenant Settings allowing admins to upload custom SVGs, choose hex colors with an interactive color picker, and preview a mock dashboard in real time.
