import { Menu, Search } from "lucide-react";
import { useUIStore } from "@/store/ui";
import { CompanySwitcher } from "./CompanySwitcher";
import { NotificationsPopover } from "./NotificationsPopover";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { AIAssistantTrigger } from "./AIAssistantSheet";
import type { User } from "@/types/domain";

export function Topbar({
  user,
  onLogout,
  navigate,
}: {
  user: User;
  onLogout: () => void;
  navigate: (path: string) => void;
}) {
  const setCmdkOpen = useUIStore((state) => state.setCmdkOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  return (
    <header
      role="banner"
      className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-background/70 px-4 backdrop-blur-xl sm:px-6"
    >
      <button
        onClick={toggleSidebar}
        className="flex size-9 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface-elevated text-muted-foreground hover:text-foreground lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="size-4" aria-hidden="true" />
      </button>

      <button
        onClick={() => setCmdkOpen(true)}
        aria-label="Open global search and command palette"
        aria-keyshortcuts="Control+K Meta+K"
        className="group flex h-9 w-full max-w-md items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface-elevated/60 px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground"
      >
        <Search className="size-4" aria-hidden="true" />
        <span className="flex-1 truncate">Search anything…</span>
        <kbd className="hidden rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-bold sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <CompanySwitcher user={user} />
        {user.role !== "SuperAdmin" && <AIAssistantTrigger />}
        <NotificationsPopover user={user} navigate={navigate} />
        <ThemeToggle />
        <UserMenu user={user} onLogout={onLogout} navigate={navigate} />
      </div>
    </header>
  );
}
