# Mings Financial Automation - App Structure

## Overview

Mings Financial Automation is a business management system for small to medium-sized businesses. It provides a unified dashboard to track sales, expenses, inventory, suppliers, and financial performance across multiple sales channels.

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Framework   | React 18 + TypeScript               |
| Build Tool  | Vite 5                              |
| Styling     | Tailwind CSS 3 (dark mode support)  |
| Icons       | Lucide React                        |
| Backend     | Supabase (PostgreSQL + Auth + Edge) |
| Hosting     | Bolt / Vite dev server              |

---

## File Organization

```
/project
├── index.html                           # HTML entry point
├── .env                                 # Supabase credentials
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json / tsconfig.app.json
│
├── /src
│   ├── main.tsx                         # App entry, wraps providers
│   ├── App.tsx                          # Router & navigation shell
│   ├── index.css                        # Tailwind directives
│   ├── translations.ts                  # i18n strings (en, az, ru)
│   ├── ConfigCheck.tsx                  # Env var validation
│   ├── ErrorBoundary.tsx                # Error boundary wrapper
│   │
│   ├── /lib
│   │   └── supabase.ts                  # Supabase client + TypeScript interfaces
│   │
│   ├── /contexts
│   │   ├── AuthContext.tsx              # Auth state (user, session, signIn/Out)
│   │   ├── ThemeContext.tsx             # Light/Dark theme toggle
│   │   └── LanguageContext.tsx          # Language selection + persistence
│   │
│   ├── /components
│   │   ├── LineChart.tsx               # SVG line chart with tooltips
│   │   ├── PieChart.tsx                # SVG pie chart with legend
│   │   └── SearchableDropdown.tsx      # Filterable select dropdown
│   │
│   ├── /screens
│   │   ├── LoginScreen.tsx             # Email/password authentication
│   │   ├── HomeScreen.tsx              # Dashboard with KPIs and charts
│   │   ├── SalesScreen.tsx             # Record and manage sales
│   │   ├── ProductsScreen.tsx          # Inventory & product management
│   │   ├── SuppliersScreen.tsx         # Supplier directory
│   │   ├── ExpensesScreen.tsx          # Fixed costs & COGS tracking
│   │   ├── ReportsScreen.tsx           # Financial analytics
│   │   ├── MoneyScreen.tsx             # Consolidated transaction view
│   │   ├── SettingsScreen.tsx          # Language, theme, channels
│   │   └── UsersScreen.tsx             # Admin user management
│   │
│   └── /screens/expenses
│       ├── ExpensesSummaryBar.tsx       # Expense totals summary
│       ├── CategoryGroupedView.tsx     # Expenses grouped by category
│       └── ManageCategoriesTab.tsx      # Category CRUD interface
│
├── /supabase
│   ├── /functions
│   │   └── /user-management
│   │       └── index.ts                # Edge function for user CRUD
│   │
│   └── /migrations                     # 35 SQL migration files
│       └── *.sql
│
└── /public/images                       # Static image assets
```

---

## Screens

| Screen          | Purpose                                                      |
|-----------------|--------------------------------------------------------------|
| LoginScreen     | Email/password sign-in via Supabase Auth                     |
| HomeScreen      | Dashboard with daily/weekly/monthly KPIs, charts, and trends |
| SalesScreen     | Add, edit, delete sales; filter by channel and date          |
| ProductsScreen  | Manage products, stock levels, pricing, supplier links       |
| SuppliersScreen | Supplier directory with contact info and product associations|
| ExpensesScreen  | Track fixed costs and COGS with two-level category system    |
| ReportsScreen   | Financial reports with breakdowns by category and channel    |
| MoneyScreen     | Unified view of all sales, expenses, and purchases           |
| SettingsScreen  | Language, theme, and sales channel configuration             |
| UsersScreen     | Admin-only user creation and deletion                        |

---

## Components

| Component          | Purpose                                    |
|--------------------|--------------------------------------------|
| LineChart          | SVG line chart with multi-series and hover  |
| PieChart           | SVG pie chart with legend and percentages   |
| SearchableDropdown | Filterable dropdown select                  |
| ExpensesSummaryBar | Expense totals and percentage breakdown     |
| CategoryGroupedView| Expenses grouped and sorted by category     |
| ManageCategoriesTab| Create, edit, delete expense categories     |

---

## Contexts (Global State)

| Context         | Manages                                                  |
|-----------------|----------------------------------------------------------|
| AuthContext      | User session, signIn, signUp, signOut                   |
| ThemeContext     | Light/Dark theme with localStorage persistence          |
| LanguageContext  | Language selection (en/az/ru) with DB + local persistence|

---

## Database Schema

### Core Tables

| Table                 | Purpose                                      |
|-----------------------|----------------------------------------------|
| users                 | User profiles with roles (admin/manager/staff)|
| user_preferences      | Per-user settings (language, etc.)            |
| sales_channels        | Sales channel definitions (name, icon, color) |
| sales                 | Individual sale transactions                  |
| products              | Product catalog with pricing and stock        |
| suppliers             | Supplier directory                            |
| purchases             | COGS purchase records                         |
| master_categories     | Two-level category hierarchy                  |
| expense_items         | Sub-items within master categories            |
| operational_expenses  | Fixed cost expenses                           |

### Supporting Tables

| Table                  | Purpose                                     |
|------------------------|---------------------------------------------|
| transactions           | Legacy transaction log                      |
| supplier_orders        | Supplier order tracking                     |
| supplier_payments      | Payment records for supplier orders         |
| price_history          | Product price change audit trail            |
| barcode_scans          | Barcode scan activity log                   |
| audit_logs             | System-wide audit trail (INSERT/UPDATE/DELETE)|
| budgets                | Budget planning by category                 |
| goals                  | Financial target tracking                   |
| recurring_transactions | Recurring expense/income definitions        |
| customers              | Customer records (future use)               |
| payment_methods        | Payment method definitions (future use)     |

### Key Database Features

- Row Level Security (RLS) enabled on all tables
- UUID primary keys with gen_random_uuid()
- Custom enums: user_role, payment_status, product_unit, category_type
- Foreign key relationships enforced across tables
- 35 migration files tracking schema evolution

---

## Edge Functions

| Function         | Method   | Purpose                        |
|------------------|----------|--------------------------------|
| user-management  | GET      | List all auth users            |
| user-management  | POST     | Create new user (email/pass)   |
| user-management  | DELETE   | Delete user by ID              |

All endpoints require Bearer token authentication and return JSON responses with CORS headers.

---

## Authentication

- Supabase email/password authentication
- JWT session tokens managed by Supabase client
- AuthContext provides global auth state
- RLS policies enforce data access rules at the database level
- Three user roles: admin, manager, staff
- Admin operations (user management) restricted by role

---

## Internationalization (i18n)

- Three supported languages: English, Azerbaijani, Russian
- 302 translation keys in `/src/translations.ts`
- Language persisted to both Supabase (user_preferences) and localStorage
- LanguageContext provides `t` object and `setLanguage` method

---

## Theme System

- Light and Dark modes via Tailwind CSS `dark:` prefix
- ThemeContext manages toggle and localStorage persistence
- `dark` class applied to HTML root element
- All screens and components support both themes

---

## Environment Variables

| Variable               | Purpose                     |
|------------------------|-----------------------------|
| VITE_SUPABASE_URL      | Supabase project URL        |
| VITE_SUPABASE_ANON_KEY | Supabase anonymous API key  |

---

## Key Patterns

- **State management:** React Context API (no external state library)
- **Data fetching:** Direct Supabase client queries in screen components
- **Routing:** Tab-based navigation managed in App.tsx (no router library)
- **Forms:** Controlled inputs with inline validation
- **Charts:** Custom SVG implementations (no charting library)
- **Styling:** Tailwind utility classes throughout
