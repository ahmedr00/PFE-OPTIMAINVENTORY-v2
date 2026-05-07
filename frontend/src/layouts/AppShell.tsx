import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { AIAssistantSheet } from "@/components/shell/AIAssistantSheet";
import type { User } from "@/types/domain";

export function AppShell({
  user,
  route,
  navigate,
  onLogout,
  children,
}: {
  user: User;
  route: string;
  navigate: (path: string) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-screen">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar role={user.role} route={route} navigate={navigate} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} onLogout={onLogout} navigate={navigate} />

        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            id="main-content"
            tabIndex={-1}
            key={route}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="flex-1 px-4 py-6 sm:px-6 lg:px-8 focus:outline-none"
          >
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </motion.main>
        </AnimatePresence>
      </div>

      <CommandPalette user={user} navigate={navigate} />
      <AIAssistantSheet user={user} />
    </div>
  );
}
