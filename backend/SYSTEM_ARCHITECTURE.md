# 🏛️ Optima Inventory - Architecture Système

## 📐 Vue d'Ensemble du Système

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        OPTIMA INVENTORY ECOSYSTEM                        │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
    │   PROSPECT   │         │ SUPER ADMIN  │         │ SAGE 100 ERP │
    │   (Public)   │         │  (Externe)   │         │  (Serveur)   │
    └──────┬───────┘         └──────┬───────┘         └──────┬───────┘
           │                        │                        │
           │ 1. Demo Request        │ 3. Sync Pull/Push      │
           ▼                        ▼                        ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                   OPTIMA INVENTORY SERVER                       │
    │  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
    │  │   API      │  │  Workflow  │  │   Sage     │                │
    │  │  Gateway   │  │   Engine   │  │ Connector  │                │
    │  └────────────┘  └────────────┘  └────────────┘                │
    │         │               │                │                      │
    │         └───────┬───────┴────────────────┘                      │
    │                 │                                                │
    │         ┌───────▼────────┐                                      │
    │         │   Email SMTP   │ ← Sends Email 1 & 2                 │
    │         └────────────────┘                                      │
    └─────────────────────────────────────────────────────────────────┘
                      │                        │
           ┌──────────┴──────┐      ┌─────────┴──────────┐
           │                 │      │                     │
           ▼                 ▼      ▼                     ▼
    ┌──────────────┐  ┌──────────────┐            ┌──────────────┐
    │ CLIENT ADMIN │  │ GESTIONNAIRE │            │   COMPTEUR   │
    │  (Desktop)   │  │  (Desktop)   │            │   (Mobile)   │
    └──────────────┘  └──────────────┘            └──────────────┘
         /app              /app                      /mobile
```

---

## 🔄 Flux de Données Complet

### Phase 1: Acquisition Client

```
   PROSPECT                    SUPER ADMIN                CLIENT ADMIN
      │                             │                          │
      │  1. Formulaire Démo         │                          │
      ├──────────────────────────►  │                          │
      │  (Landing Page)             │                          │
      │                             │                          │
      │                             │  2. Création Compte     │
      │                             │     (Manuelle)          │
      │                             │                          │
      │                             │  3. Trigger Email 1     │
      │                             ├─────────────────────────►│
      │                             │                          │
      │                             │                    📧 Email 1:
      │                             │                    - Bienvenue
      │                             │                    - URL login
      │                             │                    - Password
      │                             │                          │
      │                             │  4. Login Back-Office   │
      │                             │  ◄──────────────────────┤
      │                             │                          │
```

**Fichiers Impliqués**:

- `LandingPage.jsx` (Formulaire)
- `Users.jsx` (Email 1 trigger)

---

### Phase 2: Configuration Inventaire

```
   CLIENT ADMIN                 SAGE 100                    SERVER
      │                             │                          │
      │  1. Navigate to /app/sync   │                          │
      ├─────────────────────────────┼─────────────────────────►│
      │                             │                          │
      │  2. Click "Pull"            │                          │
      ├─────────────────────────────┼─────────────────────────►│
      │                             │                          │
      │                             │  3. Query Articles       │
      │                             │  ◄──────────────────────┤
      │                             │                          │
      │                             │  4. Return Data          │
      │                             │  ─────────────────────► │
      │                             │    - Articles            │
      │                             │    - Quantities          │
      │                             │    - Locations           │
      │                             │                          │
      │  5. Data Imported (1,247 articles)                    │
      │  ◄────────────────────────────────────────────────────┤
      │                             │                          │
```

**Fichiers Impliqués**:

- `SyncSage.jsx` (Pull/Push panels)

---

### Phase 3: Création Fiche & Affectation Compteur

```
CLIENT ADMIN              WORKFLOW ENGINE           COMPTEUR
    │                           │                      │
    │  1. Create Sheet          │                      │
    │    /app/sheets            │                      │
    ├──────────────────────────►│                      │
    │                           │                      │
    │  2. Navigate to Detail    │                      │
    │    /app/sheets/:id        │                      │
    ├──────────────────────────►│                      │
    │                           │                      │
    │  3. Select Compteur       │                      │
    │    Dropdown: Marie        │                      │
    ├──────────────────────────►│                      │
    │                           │                      │
    │  4. Click "Envoyer Email" │                      │
    ├──────────────────────────►│                      │
    │                           │                      │
    │                           │  5. Trigger Email 2  │
    │                           ├─────────────────────►│
    │                           │                      │
    │                           │                📧 Email 2:
    │                           │                - Sheet ID
    │                           │                - Instructions
    │                           │                - Mobile link
    │                           │                      │
    │  6. Toast Confirmation    │                      │
    │  ◄────────────────────────┤                      │
    │                           │                      │
```

**Fichiers Impliqués**:

- `SheetDetail.jsx` (Assignment + Email 2 trigger)

---

### Phase 4: Comptage Mobile (Cœur du Système)

```
COMPTEUR (Mobile)          SERVER                  CLIENT ADMIN (Desktop)
    │                        │                            │
    │  1. Login Mobile       │                            │
    │    /mobile             │                            │
    ├───────────────────────►│                            │
    │                        │                            │
    │  2. View Tasks         │                            │
    │    GET /tasks          │                            │
    ├───────────────────────►│                            │
    │  ◄──────────────────── │  Tasks List                │
    │                        │                            │
    │  3. Start Count        │                            │
    │    /mobile/count/:id   │                            │
    ├───────────────────────►│                            │
    │                        │                            │
    │  4. Count Article      │                            │
    │    📱 Blind Counting   │                            │
    │    (No Theoretical)    │                            │
    │                        │                            │
    │  Counted: 48 units     │                            │
    │                        │                            │
    │  5. Submit Count       │                            │
    │    POST /count         │                            │
    ├───────────────────────►│                            │
    │    {                   │                            │
    │      articleId: ART-001│                            │
    │      counted: 48       │                            │
    │    }                   │                            │
    │                        │                            │
    │                        │  6. Calculate Difference   │
    │                        │     Theoretical: 50        │
    │                        │     Counted: 48            │
    │                        │     Diff: -2 ❌           │
    │                        │                            │
    │                        │  7. Update Dashboard       │
    │                        ├───────────────────────────►│
    │                        │    Real-time WS/SSE        │
    │                        │                            │
    │  8. Next Article       │                   🔴 Red Row: -2
    │  ◄──────────────────── │                   ART-001 Missing
    │                        │                            │
```

**Formule Centrale**:

```javascript
// Serveur - Consolidation automatique
const difference = countedQuantity - theoreticalQuantity;

if (difference > 0) {
  status = "EXCÉDENT"; // Green
  color = "bg-green-50";
} else if (difference < 0) {
  status = "MANQUANT"; // Red
  color = "bg-red-50";
} else {
  status = "CONFORME"; // Gray
  color = "bg-slate-50";
}
```

**Fichiers Impliqués**:

- `MobileCount.jsx` (Blind counting interface)
- `SheetDetail.jsx` (Real-time dashboard update)

---

### Phase 5: Validation & Export vers Sage

```
CLIENT ADMIN                SERVER                  SAGE 100
    │                         │                        │
    │  1. Review Differences  │                        │
    │    /app/sheets/:id      │                        │
    │    See Red/Green rows   │                        │
    │                         │                        │
    │  2. Validate Results    │                        │
    │    Approve differences  │                        │
    ├────────────────────────►│                        │
    │                         │                        │
    │  3. Navigate to Sync    │                        │
    │    /app/sync            │                        │
    ├────────────────────────►│                        │
    │                         │                        │
    │  4. Click "Push"        │                        │
    ├────────────────────────►│                        │
    │                         │                        │
    │                         │  5. Export Data        │
    │                         ├───────────────────────►│
    │                         │    - Counted Qtys      │
    │                         │    - Differences       │
    │                         │    - Validations       │
    │                         │    - Photos/Comments   │
    │                         │                        │
    │                         │  6. Update Sage        │
    │                         │  ◄─────────────────────┤
    │                         │                        │
    │  7. Success Toast       │                        │
    │  ◄────────────────────── │                       │
    │  293 articles exported  │                        │
    │                         │                        │
```

**Fichiers Impliqués**:

- `SyncSage.jsx` (Push panel)

---

## 🗂️ Structure des Données

### Article Object

```javascript
{
  id: "ART-001",
  reference: "REF-12345",
  designation: "Ordinateur Portable HP",
  location: "Zone A-12",
  barcode: "1234567890123",

  // From Sage 100 (Pull)
  theoreticalQuantity: 50,
  unitPrice: 899.99,

  // From Mobile Counting
  countedQuantity: 48,
  countedBy: "marie.dubois@company.fr",
  countedAt: "2026-04-04T14:30:00Z",
  photos: ["photo1.jpg"],
  comments: "2 unités endommagées",

  // Calculated by Server
  difference: -2, // 48 - 50
  status: "MANQUANT",
  colorCode: "red"
}
```

### Inventory Sheet Object

```javascript
{
  id: "INV-2026-001",
  name: "Inventaire Entrepôt A",
  createdDate: "2026-04-01",
  createdBy: "admin@company.fr",

  status: "En cours",

  // Counting phases
  comptage1: {
    compteurEmail: "marie.dubois@company.fr",
    status: "En cours",
    assignedAt: "2026-04-01T09:00:00Z",
    emailSent: true
  },
  comptage2: {
    compteurEmail: null,
    status: "Non démarré",
    assignedAt: null,
    emailSent: false
  },
  comptage3: {
    compteurEmail: null,
    status: "Non démarré",
    assignedAt: null,
    emailSent: false
  },

  // Progress
  totalArticles: 450,
  countedArticles: 293,
  progressPercent: 65,

  // Differences
  positiveVariances: 10, // Excédents
  negativeVariances: 4,  // Manquants
  conformArticles: 279   // Conformes
}
```

### Email Templates

#### Email 1: Welcome (Client Admin)

```javascript
{
  to: "admin@company.fr",
  subject: "Bienvenue sur Optima Inventory",
  template: "welcome_admin",
  variables: {
    fullName: "Jean Dupont",
    companyName: "Entreprise SARL",
    loginUrl: "https://app.optima-inventory.com/app",
    email: "admin@company.fr",
    temporaryPassword: "Xy9#mK2pQ!",
    expiresIn: "24 heures"
  },
  triggeredBy: "SuperAdmin",
  triggeredAt: "2026-04-01T08:00:00Z"
}
```

#### Email 2: Task Assignment (Compteur)

```javascript
{
  to: "marie.dubois@company.fr",
  subject: "Nouvelle tâche de comptage - INV-2026-001",
  template: "task_assignment",
  variables: {
    compteurName: "Marie Dubois",
    sheetId: "INV-2026-001",
    sheetName: "Inventaire Entrepôt A",
    totalArticles: 450,
    assignedBy: "admin@company.fr",
    mobileAppUrl: "https://app.optima-inventory.com/mobile",
    iosDownload: "https://apps.apple.com/...",
    androidDownload: "https://play.google.com/..."
  },
  triggeredBy: "ClientAdmin",
  triggeredAt: "2026-04-01T09:15:00Z"
}
```

---

## 🎨 Component Architecture

### Desktop Application (Back-Office)

```
App.tsx (RouterProvider)
│
├─ routes.jsx
│  │
│  ├─ / → LandingPage.jsx
│  │     └─ Public landing with demo form
│  │
│  └─ /app → DashboardLayout.jsx
│        │
│        ├─ Sidebar Navigation
│        │  - Deep Navy bg-slate-900
│        │  - Emerald active state
│        │
│        ├─ Top Bar
│        │  - White bg
│        │  - Notification bell
│        │
│        └─ Main Content (Outlet)
│           │
│           ├─ Dashboard.jsx
│           │  ├─ 4 KPI Cards
│           │  ├─ Activity Chart (recharts)
│           │  ├─ Sage Sync Status
│           │  └─ Recent Sheets Table
│           │
│           ├─ InventorySheets.jsx
│           │  ├─ Search & Filters
│           │  └─ Sortable Table
│           │
│           ├─ SheetDetail.jsx ⭐
│           │  ├─ Workflow Steps (1/2/3)
│           │  ├─ Compteur Assignment
│           │  ├─ Email 2 Trigger
│           │  ├─ Summary Cards
│           │  ├─ Articles Table (Color-coded)
│           │  └─ Formula Display
│           │
│           ├─ SyncSage.jsx
│           │  ├─ Connection Status
│           │  ├─ Pull Panel (Blue)
│           │  ├─ Push Panel (Green)
│           │  └─ Sync History
│           │
│           ├─ Users.jsx
│           │  ├─ Role Descriptions
│           │  ├─ Email 1 Workflow Info
│           │  └─ Users Table
│           │
│           └─ Reports.jsx
│              └─ Download Cards (PDF/Excel)
```

### Mobile Application (Terrain)

```
App.tsx (RouterProvider)
│
└─ /mobile → MobileLayout.jsx
       │
       ├─ Status Bar (iOS style)
       ├─ Top Header (Emerald)
       │
       ├─ Main Content (Outlet)
       │  │
       │  ├─ MobileHome.jsx
       │  │  ├─ Welcome Card (Gradient)
       │  │  ├─ Stats Cards
       │  │  └─ Task Cards (with progress)
       │  │
       │  ├─ MobileCount.jsx ⭐
       │  │  ├─ Progress Bar
       │  │  ├─ Article Info Card
       │  │  ├─ Blind Counting Notice
       │  │  ├─ Quantity Display (Large)
       │  │  ├─ Number Pad (3x4)
       │  │  ├─ Action Buttons (Photo/Note/Flag)
       │  │  └─ Navigation Buttons
       │  │
       │  ├─ MobileScanner.jsx
       │  │  ├─ Camera Simulation
       │  │  ├─ Manual Entry
       │  │  └─ Result Card
       │  │
       │  └─ MobileProfile.jsx
       │     ├─ User Header (Gradient)
       │     ├─ Stats Grid
       │     └─ Account Info
       │
       └─ Bottom Navigation (4 icons)
          - Home, Tasks, Scanner, Profile
```

---

## 🔐 Security & Authentication Flow

```
┌────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION LAYERS                      │
└────────────────────────────────────────────────────────────────┘

Public Routes:
    / (Landing Page)                      [No Auth Required]

Protected Routes (Desktop):
    /app/*                                [JWT Token Required]
    │
    ├─ Role: Admin                        [Full Access]
    ├─ Role: Gestionnaire                 [Limited Access]
    └─ Role: Compteur                     [Redirect to /mobile]

Protected Routes (Mobile):
    /mobile/*                             [JWT Token Required]
    │
    └─ Role: Compteur ONLY                [Mobile Access Only]

Session Management:
    - JWT stored in httpOnly cookie
    - Refresh token rotation
    - Automatic logout after 8h inactivity
    - Multi-device support

Sage Integration:
    - API key stored server-side only
    - Connection pool management
    - Rate limiting: 100 req/min
    - SSL/TLS encryption required
```

---

## 📊 Performance Metrics

### Target Performance

```javascript
const performanceTargets = {
  // Frontend
  initialLoadTime: "< 2s",
  timeToInteractive: "< 3s",
  firstContentfulPaint: "< 1s",

  // Backend
  apiResponseTime: {
    average: "< 200ms",
    p95: "< 500ms",
    p99: "< 1s",
  },

  // Database
  queryTime: {
    simple: "< 50ms",
    complex: "< 200ms",
    aggregation: "< 500ms",
  },

  // Sage Sync
  pullSync: {
    "1000 articles": "< 30s",
    "10000 articles": "< 5min",
  },
  pushSync: {
    "100 differences": "< 10s",
    "1000 differences": "< 1min",
  },

  // Real-time Updates
  websocketLatency: "< 100ms",
  dashboardRefresh: "Immediate (SSE)",
};
```

---

## 🌐 Technology Stack

### Frontend

```
React 18.3.1              - UI framework
React Router 7.13.0       - Routing (Data mode)
Tailwind CSS 4.1.12       - Styling
Recharts 2.15.2           - Charts/Graphs
Lucide React 0.487.0      - Icons
Radix UI                  - Accessible components
Sonner                    - Toast notifications
Motion (Framer Motion)    - Animations
```

### Backend (Not Implemented - Architecture Only)

```
Node.js + Express         - API server
PostgreSQL                - Main database
Redis                     - Cache & sessions
WebSockets/SSE            - Real-time updates
SMTP (SendGrid/AWS SES)   - Email delivery
Bull/BullMQ               - Job queue (async tasks)
```

### Integration

```
Sage 100 Connector        - Custom API wrapper
ODBC/SQL Server           - Direct DB connection (read-only)
REST API                  - Data exchange
Scheduled Jobs (Cron)     - Auto-sync every hour
```

### DevOps (Production)

```
Docker                    - Containerization
Nginx                     - Reverse proxy
PM2                       - Process manager
PostgreSQL                - Database
Redis                     - Cache
```

---

## 🔄 State Management

### Desktop Application

```javascript
// Global State (Context/Zustand)
{
  user: {
    id: 'user-123',
    email: 'admin@company.fr',
    role: 'Admin',
    permissions: ['create', 'read', 'update', 'delete']
  },

  sageConnection: {
    status: 'connected',
    lastSync: '2026-04-04T14:35:00Z',
    nextSync: '2026-04-04T15:35:00Z'
  },

  notifications: [
    {
      id: 'notif-1',
      type: 'task_assigned',
      message: 'Nouvelle tâche assignée',
      read: false
    }
  ]
}

// Local Component State
- Forms: react-hook-form
- Tables: Local useState
- Modals: Local useState
```

### Mobile Application

```javascript
// Offline-First State
{
  currentTask: {
    sheetId: 'INV-2026-001',
    articles: [...],
    currentArticleIndex: 0
  },

  offlineQueue: [
    {
      action: 'submit_count',
      articleId: 'ART-001',
      quantity: 48,
      timestamp: '2026-04-04T14:30:00Z',
      synced: false
    }
  ],

  syncStatus: {
    online: true,
    pendingSync: 0,
    lastSync: '2026-04-04T14:30:00Z'
  }
}
```

---

## 📱 Responsive Breakpoints

```css
/* Tailwind v4 default breakpoints */

/* Mobile First Approach */
/* Default: 0px - 639px (mobile) */
.container {
  max-width: 100%;
  padding: 1rem;
}

/* sm: 640px+ (large mobile) */
@media (min-width: 640px) {
  .container {
    max-width: 640px;
  }
}

/* md: 768px+ (tablet) */
@media (min-width: 768px) {
  .grid-layout {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* lg: 1024px+ (desktop) */
@media (min-width: 1024px) {
  .sidebar {
    display: block; /* Show sidebar */
  }
  .grid-layout {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* xl: 1280px+ (large desktop) */
@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}

/* 2xl: 1536px+ (extra large) */
@media (min-width: 1536px) {
  .container {
    max-width: 1536px;
  }
}

/* Mobile Specific (Optima Inventory) */
.mobile-layout {
  max-width: 448px; /* md breakpoint */
  margin: 0 auto;
  border-left: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
}
```

---

## 🎯 Critical User Journeys

### Journey 1: Admin Creates First Inventory

```
1. Login → /app
2. Navigate → /app/sync
3. Click "Pull" → Import 1,247 articles from Sage
4. Toast: "Import réussi"
5. Navigate → /app/sheets
6. Click "Nouvelle Fiche"
7. Fill form: Name, Date, Articles selection
8. Submit → Sheet created
9. Navigate → /app/sheets/INV-2026-001
10. Select Compteur 1 → marie.dubois@company.fr
11. Click "Envoyer Email" → Email 2 sent
12. Toast: "Email envoyé à Marie"
13. Wait for mobile counting...
```

### Journey 2: Compteur Performs Counting

```
1. Receive Email 2 → "Nouvelle tâche INV-2026-001"
2. Download mobile app
3. Login → /mobile
4. See task card with 65% progress
5. Click task → /mobile/count/INV-2026-001
6. See article: Ordinateur Portable HP
7. Notice: "Comptage Aveugle" (no theoretical qty shown)
8. Use number pad: Type "48"
9. Optional: Add photo, comment
10. Click "Valider"
11. Toast: "Quantité validée: 48"
12. Server calculates: Diff = 48 - 50 = -2
13. Next article appears
14. Repeat until all counted
15. Final toast: "Comptage terminé!"
```

### Journey 3: Admin Reviews Results

```
1. Receive notification: "Comptage 1 terminé"
2. Navigate → /app/sheets/INV-2026-001
3. See "Comptage 1" status: "Complété" (green)
4. Scroll to articles table
5. See color-coded rows:
   - RED: ART-001, Diff: -2 (missing)
   - GREEN: ART-002, Diff: +5 (excess)
   - GRAY: ART-003, Diff: 0 (conform)
6. Review photos/comments for flagged items
7. Decide: Validate or trigger Comptage 2
8. If validated → Navigate /app/sync
9. Click "Push" → Export to Sage
10. Toast: "293 articles exportés vers Sage"
11. Done!
```

---

## 🚨 Error Handling

### Frontend Error Boundaries

```javascript
// Global error boundary
<ErrorBoundary fallback={<ErrorPage />}>
  <RouterProvider router={router} />
</ErrorBoundary>;

// Network errors
if (response.status === 401) {
  // Redirect to login
  navigate("/login");
}

if (response.status >= 500) {
  // Show error toast
  toast.error("Erreur serveur. Réessayez plus tard.");
}
```

### Offline Handling (Mobile)

```javascript
// Service Worker for offline capability
if (!navigator.onLine) {
  // Queue action locally
  offlineQueue.push(action);
  toast.info("Action enregistrée. Synchronisation au retour en ligne.");
}

// When back online
window.addEventListener("online", () => {
  syncOfflineQueue();
  toast.success("Connexion rétablie. Synchronisation en cours...");
});
```

---

_Architecture documentée le 04/04/2026 - Optima Inventory v1.0.0_
