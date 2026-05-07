import { LogOut, Settings, ShieldCheck, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Badge } from "@/components/ui/Badge";
import { initials } from "@/lib/format";
import { displayRole } from "@/utils/roles";
import type { User } from "@/types/domain";

export function UserMenu({
  user,
  onLogout,
  navigate,
}: {
  user: User;
  onLogout: () => void;
  navigate: (path: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-9 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface-elevated/60 pl-1.5 pr-2.5 text-left transition-colors hover:bg-surface-elevated">
        <Avatar className="size-7">
          <AvatarFallback className="text-[10px]">{initials(user.name, user.email)}</AvatarFallback>
        </Avatar>
        <div className="hidden flex-col leading-tight md:flex">
          <span className="max-w-[140px] truncate text-xs font-semibold">
            {user.name || user.email}
          </span>
          <span className="text-[10px] text-muted-foreground">{displayRole(user.role)}</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2.5 normal-case tracking-normal text-foreground">
          <Avatar className="size-9">
            <AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.name || "Member"}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <div className="px-2.5 pb-2">
          <Badge tone={user.role === "SuperAdmin" ? "ai" : "primary"}>
            <ShieldCheck className="size-3" /> {displayRole(user.role)}
          </Badge>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/app/settings")}>
          <UserIcon className="size-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/app/settings")}>
          <Settings className="size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="text-crimson focus:bg-crimson/10 focus:text-crimson"
        >
          <LogOut className="size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
