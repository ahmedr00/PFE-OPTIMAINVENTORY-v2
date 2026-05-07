import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { queryClient } from "@/lib/query";
import { useApplyTheme } from "@/store/theme";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useApplyTheme();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={150}>
        {children}
        <Toaster
          position="top-right"
          richColors
          theme="system"
          toastOptions={{
            classNames: {
              toast:
                "rounded-[var(--radius-md)] border border-border bg-surface text-foreground shadow-[var(--shadow-glass)]",
            },
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
