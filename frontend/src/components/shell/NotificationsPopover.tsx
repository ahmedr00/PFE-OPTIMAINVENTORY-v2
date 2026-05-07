import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, CheckCheck, ClipboardList, Inbox, UserPlus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";
import { Button } from "@/components/ui/Button";
import { notificationService } from "@/api/services";
import { formatRelativeDate } from "@/lib/format";
import type { Notification, User } from "@/types/domain";

export function NotificationsPopover({
  user,
  navigate,
}: {
  user: User;
  navigate: (path: string) => void;
}) {
  const queryClient = useQueryClient();
  const notifications = useQuery({
    queryKey: ["notifications", user._id],
    queryFn: notificationService.list,
    refetchInterval: 30_000,
  });
  const markRead = useMutation({
    mutationFn: notificationService.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user._id] }),
  });
  const markAllRead = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user._id] }),
  });

  const items = notifications.data?.notifications || [];
  const count = notifications.data?.unreadCount ?? items.filter((item) => !item.readAt).length;

  const openNotification = (item: Notification) => {
    if (!item.readAt) markRead.mutate(item._id);
    if (item.href) navigate(item.href);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label="Notifications"
              className="relative flex size-9 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface-elevated text-muted-foreground transition-colors hover:text-foreground"
            >
              <Bell className="size-4" />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-crimson text-[9px] font-bold text-white shadow-[0_0_0_2px_rgb(var(--background))]">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Notifications</TooltipContent>
        </Tooltip>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-[11px] text-muted-foreground">
              {count > 0 ? `${count} unread` : "You're all caught up"}
            </p>
          </div>
          {count > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()}>
              <CheckCheck className="size-3.5" /> Mark read
            </Button>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto border-t border-border">
          {count === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
              <Inbox className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No new notifications.</p>
            </div>
          ) : (
            <ul className="flex flex-col">
              {items.map((item, index) => {
                const Icon = item.type === "trial_request" ? UserPlus : ClipboardList;
                const tone = item.type === "count_completed" ? "primary" : "amber";
                return (
                  <motion.li
                    key={item._id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <button
                      onClick={() => openNotification(item)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-elevated"
                    >
                      <span
                        className={
                          tone === "amber"
                              ? "flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber/15 text-amber"
                              : "flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary"
                        }
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {!item.readAt && <span className="mr-1 inline-block size-1.5 rounded-full bg-crimson align-middle" />}
                          {item.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{item.body}</p>
                        {item.createdAt && (
                          <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                            {formatRelativeDate(item.createdAt)}
                          </p>
                        )}
                      </div>
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
