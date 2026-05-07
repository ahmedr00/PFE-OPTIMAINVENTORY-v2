import { useEffect, useMemo, useState } from "react";
import type { RouteContext } from "../types/domain";

const routePatterns = [
  { route: "inventory-detail", pattern: /^\/app\/inventories\/([^/]+)$/ },
  { route: "sheet-detail", pattern: /^\/app\/sheets\/([^/]+)$/ },
  { route: "login", pattern: /^\/login$/ },
  { route: "forgot-password", pattern: /^\/forgot-password$/ },
  { route: "reset-password", pattern: /^\/reset-password\/([^/]+)$/ },
  { route: "dashboard", pattern: /^\/app\/?$/ },
  { route: "companies", pattern: /^\/app\/companies\/?$/ },
  { route: "warehouses", pattern: /^\/app\/warehouses\/?$/ },
  { route: "articles", pattern: /^\/app\/articles\/?$/ },
  { route: "inventories", pattern: /^\/app\/inventories\/?$/ },
  { route: "sheets", pattern: /^\/app\/sheets\/?$/ },
  { route: "users", pattern: /^\/app\/users\/?$/ },
  { route: "reports", pattern: /^\/app\/reports\/?$/ },
  { route: "settings", pattern: /^\/app\/settings\/?$/ },
  { route: "mobile", pattern: /^\/mobile\/?$/ },
  { route: "landing", pattern: /^\/$/ },
];

function getRouteState(pathname = window.location.pathname) {
  for (const { route, pattern } of routePatterns) {
    const match = pathname.match(pattern);
    if (match) {
      return { route, params: { id: match[1] || "" } };
    }
  }
  return { route: "not-found", params: { id: "" } };
}

export function useRoute(): RouteContext {
  const [state, setState] = useState(getRouteState);

  useEffect(() => {
    const onPopState = () => setState(getRouteState());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return useMemo(
    () => ({
      ...state,
      navigate(path: string) {
        window.history.pushState({}, "", path);
        setState(getRouteState(path));
      },
    }),
    [state],
  );
}
