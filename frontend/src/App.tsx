import { lazy, Suspense, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { authService } from "./api/services";
import { useRoute } from "./hooks/useRoute";
import { AppShell } from "./layouts/AppShell";
import { PageFallback } from "./components/PageFallback";
import { LoginPage } from "./pages/auth/LoginPage";
import type { User } from "./types/domain";
import { isAdminRole, isCounterRole } from "./utils/roles";

const LandingPage = lazy(() =>
  import("./pages/LandingPage").then((module) => ({ default: module.LandingPage })),
);
const ArticlesPage = lazy(() =>
  import("./pages/ArticlesPage").then((module) => ({ default: module.ArticlesPage })),
);
const CompaniesPage = lazy(() =>
  import("./pages/CompaniesPage").then((module) => ({ default: module.CompaniesPage })),
);
const CompteurPage = lazy(() =>
  import("./pages/CompteurPage").then((module) => ({ default: module.CompteurPage })),
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage })),
);
const InventoriesPage = lazy(() =>
  import("./pages/InventoriesPage").then((module) => ({ default: module.InventoriesPage })),
);
const InventoryDetailPage = lazy(() =>
  import("./pages/InventoryDetailPage").then((module) => ({ default: module.InventoryDetailPage })),
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })),
);
const ReportsPage = lazy(() =>
  import("./pages/ReportsPage").then((module) => ({ default: module.ReportsPage })),
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((module) => ({ default: module.SettingsPage })),
);
const UsersPage = lazy(() =>
  import("./pages/UsersPage").then((module) => ({ default: module.UsersPage })),
);
const WarehousesPage = lazy(() =>
  import("./pages/WarehousesPage").then((module) => ({ default: module.WarehousesPage })),
);

const publicRoutes = new Set(["landing", "login", "forgot-password", "reset-password", "mobile"]);
const superAdminRoutes = new Set(["dashboard", "companies", "users", "settings"]);
const adminRoutes = new Set([
  "dashboard",
  "warehouses",
  "articles",
  "inventories",
  "inventory-detail",
  "users",
  "reports",
  "settings",
]);

function isRouteAllowed(user: User, route: string) {
  if (isCounterRole(user.role)) return route === "mobile" || route === "settings";
  if (user.role === "SuperAdmin") return superAdminRoutes.has(route);
  if (isAdminRole(user.role)) return adminRoutes.has(route);
  return route === "dashboard";
}

function BootSplash() {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-label="Booting Optima Inventory"
      className="flex min-h-screen items-center justify-center bg-background"
    >
      <div className="flex flex-col items-center gap-3">
        <span className="ai-gradient flex size-14 animate-pulse items-center justify-center rounded-2xl text-white shadow-[0_20px_60px_-20px_rgb(var(--ai-from)/0.6)]">
          <Sparkles className="size-6" aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold tracking-tight">Booting Optima Inventory</p>
        <p className="text-xs text-muted-foreground">Securing your workspace…</p>
      </div>
    </main>
  );
}

function App() {
  const routeContext = useRoute();
  const { route, params, navigate } = routeContext;
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    authService
      .check()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  const logout = async () => {
    await authService.logout().catch(() => undefined);
    setUser(null);
    navigate("/login");
  };

  const login = (loggedInUser: User) => {
    setUser(loggedInUser);
    navigate(isCounterRole(loggedInUser.role) ? "/mobile" : "/app");
  };

  if (checking) return <BootSplash />;

  if (route === "landing") {
    return (
      <Suspense fallback={<BootSplash />}>
        <LandingPage navigate={navigate} />
      </Suspense>
    );
  }
  if (route === "mobile" && (!user || isCounterRole(user.role))) {
    return (
      <Suspense fallback={<BootSplash />}>
        <CompteurPage />
      </Suspense>
    );
  }
  if (!user && publicRoutes.has(route)) {
    return (
      <LoginPage
        initialMode={
          route === "forgot-password" ? "forgot" : route === "reset-password" ? "reset" : "login"
        }
        resetToken={params.id}
        onLogin={login}
      />
    );
  }
  if (!user) return <LoginPage onLogin={login} />;

  const protectedRoute = isCounterRole(user.role) && route !== "settings" ? "mobile" : route;
  const content = !isRouteAllowed(user, protectedRoute) ? (
    <NotFoundPage navigate={navigate} />
  ) : protectedRoute === "dashboard" ? (
    <DashboardPage user={user} navigate={navigate} />
  ) : protectedRoute === "companies" ? (
    <CompaniesPage />
  ) : protectedRoute === "warehouses" ? (
    <WarehousesPage user={user} />
  ) : protectedRoute === "articles" ? (
    <ArticlesPage user={user} />
  ) : protectedRoute === "inventories" ? (
    <InventoriesPage user={user} navigate={navigate} />
  ) : protectedRoute === "inventory-detail" ? (
    <InventoryDetailPage id={params.id} navigate={navigate} />
  ) : protectedRoute === "users" ? (
    <UsersPage currentUser={user} />
  ) : protectedRoute === "reports" ? (
    <ReportsPage user={user} />
  ) : protectedRoute === "settings" ? (
    <SettingsPage user={user} />
  ) : protectedRoute === "mobile" ? (
    <CompteurPage />
  ) : (
    <NotFoundPage navigate={navigate} />
  );

  return (
    <AppShell user={user} route={protectedRoute} navigate={navigate} onLogout={logout}>
      <Suspense fallback={<PageFallback />}>{content}</Suspense>
    </AppShell>
  );
}

export default App;
