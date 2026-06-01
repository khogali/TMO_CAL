# T-Mobile Sales Center (T-Quote) - Technical Overview

Welcome to the technical preview documentation for the **T-Mobile Sales Center (T-Quote)** application. This document is intended for developers, architects, and technical stakeholders to understand the architecture, tech stack, and core functionalities of the platform.

## 🚀 Application Summary
T-Quote is an intelligent, offline-capable command center designed for telecommunications sales representatives. It manages the entire sales lifecycle—from lead onboarding and pipeline management to AI-assisted quote generation, dynamic promotion stacking, and performance tracking.

## 🛠 Tech Stack & Architecture
The application uses a modern frontend stack designed for speed, offline reliability, and fluid mobile-first user experiences.

### Core Technologies
*   **Frontend Framework:** React 19 + TypeScript
*   **Build Tool:** Vite (for fast HMR and optimized production builds)
*   **Styling:** Tailwind CSS (with custom Tailwind config for app-branded theme and custom keyframe animations)
*   **State Management:** React Context API (`AppContext` divided into `UI`, `Auth`, and `Data` slices)
*   **Database (Cloud):** Firebase Realtime Database & Firebase Authentication
*   **Database (Local/Offline):** Dexie.js (IndexedDB wrapper for robust offline-first synchronization)
*   **Generative AI:** Google Gen AI SDK (`@google/genai`) 
*   **PWA / App Shell:** Progressive Web App with custom service worker caching and a strict `MobileAppShell` layout for cross-device consistency.

### Architectural Patterns
*   **Offline-First Sync:** Data is immediately read from and written to a local `Dexie` IndexedDB. A background synchronization service mirrors data to Firebase Realtime Database when online, allowing reps to generate quotes in store dead-zones.
*   **Context-Driven Modular Architecture:** Application state is entirely lifted into highly specialized context providers (`UseAuth`, `UseData`, `UseUI`), keeping UI components completely stateless regarding business logic.
*   **Deep Linking:** Implemented custom hash-based routing/deep-linking (e.g., navigating directly to a specific lead profile via `leadToView`).

## 🧠 Core Systems & Engines

### 1. Calculation & Promotion Engine (`/utils/calculations.ts`)
The heaviest lifting occurs in the calculation engine, which resolves complex telecom schemas:

*   **Plan Pricing Resolution:** Analyzes `QuoteConfig.lines` against the selected `PlanDetails`. Maps line counts to tiered structures (e.g., Line 1: $90, Line 2: $60, Line 3: $0) or calculates flat line-addition rates.
*   **Standard Discounts:** Automatically evaluates and subtracts "standard" telecom discounts before applying complex promotions:
    *   **Third Line Free:** Verifies if the 3rd line exists and subtracts its specific tiered cost.
    *   **Autopay & Insider:** Calculates flat or percentage-based reductions off the base plan price.
*   **Promotion Engine & Rule Stacking:**
    *   **Condition Checking:** Iterates over active `Promotion` objects, recursively testing rules defined in `conditions` using `checkCondition()` (e.g., "Must have Go5G Plus AND Trade-In AND Port-In").
    *   **Stacking Groups:** Groups eligible account-level promos by their `StackingGroup`. Evaluates exclusive groups to ensure only the highest-value promotion within a restricted group (like overlapping flat rate plan discounts) is applied.
    *   **BOGO Validation:** For device Buy-One-Get-One offers, pre-counts eligible cart models against requirements. Limits the number of applied "Get" credits using `promo.bogoConfig.buyQuantity`.
    *   **Reimbursement vs Trade-In Conflicts:** Handles multi-path logic for devices with competitor owed amounts (Carrier Freedom / Keep & Switch) vs standard Trade-In promos preventing illogical credit stacking on a single IMEI. 
*   **Financing (Equipment Credit - EC):**
    *   Calculates the total requested financing for Devices and Accessories (`financedByDevicesInCents + financedByAccessoriesInCents`).
    *   Determines `availableFinancingLimitInCents` based on the user's configured `maxEC` or `perLineEC * lines`.
    *   If total > available, it forces the overflow into a mandatory `requiredDownPaymentInCents` due at signing. 
*   **Due Today & Proration:** Calculates Day-1 cash flow. Sums one-time Activation Fees, mandatory down payments, tax on the *full retail amount* of financed devices (standard US telecom tax law), and the retail sum of paid-in-full accessories.

### 2. Generative AI Capabilities (`/services/geminiApi.ts`)
*   **"Magic Quote" (QuoteWizard):** Leverages `gemini-pro` (or equivalent models) via `@google/genai` to parse natural language user intent into structured JSON (`QuoteConfig`). (e.g., "Customer wants 3 lines on Go5G Plus with two iPhone 15s").
*   **AI Sales Coach:** Reads the user's active leads pipeline and generates personalized strategic advice on how to close pending deals or optimize the sales pitch.

### 3. Pipeline & Lead Management (`LeadsPortal`)
*   Supports multiple interactive views: **List**, **Kanban Board**, and **Calendar**.
*   **Complex Filtering:** Real-time filtering by status, assignee, tags, and fuzzy text search.
*   **Version History Tracker:** Every quote adjustment within a lead saves an immutable `QuoteVersion` object, creating a verifiable audit trail of interactions.

## 📂 Key Directory Structure

```text
/
├── components/          # Reusable UI building blocks
│   ├── ui/              # Primitive components (Button, Modal, Select, etc.)
│   ├── home/            # Dashboard visualization components
│   ├── leads/           # List, Board, and Calendar views for pipeline
│   ├── formSections/    # Forms for manual quoting
│   └── customer/        # Customer-facing UI/shared link renderers
├── context/             # React Contexts (AppContext.tsx)
├── services/            # API Integrators (Firebase, Dexie, Gemini)
├── utils/               # Pure functions (Calculations, Promos, Validation)
├── types.ts             # Global TypeScript interfaces & Enums
├── constants.ts         # Initial Database states and Configuration bounds
├── index.css            # Tailwind directives and generic styles
├── App.tsx              # Main orchestrator, Routing, Context Provider
└── vite.config.ts       # Environment build configuration
```

## 🔒 Authentication & Roles
T-Quote uses Firebase Authentication. It supports a Role-Based Access Control (RBAC) setup:
*   **Rep:** Can access their own leads and generate quotes.
*   **Store Manager:** Can view all leads affiliated with a specific `storeId`.
*   **District Manager:** Can oversee multiple stores under `managedStoreIds`.
*   **Admin:** Application-wide configurability (updating rate plans, discounts, etc. via the AdminPanel).

## 💻 Development & Deployment

### Environment Setup
Requires a `.env.local` containing standard Firebase configuration keys, along with:
*   `VITE_GEMINI_API_KEY`: API Key for Google Generative AI capabilities.

### NPM Scripts
*   `npm run dev`: Starts the Vite dev server on port `3000` (bound to `0.0.0.0` for AI Studio previewing).
*   `npm run build`: Compiles TS and Vite bundle into `/dist`.
*   `npm run preview`: Hosts the built output.
*   `npm run test`: Test runner via Vitest.

---

*Documentation generated for developer hand-off and technical review.*
