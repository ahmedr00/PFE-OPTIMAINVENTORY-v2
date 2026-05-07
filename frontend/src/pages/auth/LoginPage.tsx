import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { authService } from "@/api/services";
import { AuthBackground } from "@/components/auth/AuthBackground";
import { BrandHeader } from "@/components/auth/BrandHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Notice } from "@/components/ui/Notice";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import type { User } from "@/types/domain";

type Mode = "login" | "forgot" | "reset";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(4, "Password too short"),
});
const forgotSchema = z.object({
  email: z.string().email("Enter a valid email"),
});
const resetSchema = z
  .object({
    token: z.string().min(8, "Reset token required"),
    password: z.string().min(6, "Min 6 characters"),
    confirm: z.string().min(6, "Min 6 characters"),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

const TITLES: Record<Mode, { title: string; subtitle: string }> = {
  login: {
    title: "Welcome back",
    subtitle: "Access your AI-powered inventory operating system.",
  },
  forgot: {
    title: "Recover your account",
    subtitle: "We'll send a secure link to reset your password.",
  },
  reset: {
    title: "Choose a new password",
    subtitle: "Use a strong password you don't reuse anywhere else.",
  },
};

export function LoginPage({
  initialMode = "login",
  resetToken = "",
  onLogin,
}: {
  initialMode?: "login" | "forgot" | "reset" | "setup";
  resetToken?: string;
  onLogin: (user: User) => void;
}) {
  const [mode, setMode] = useState<Mode>(initialMode === "setup" ? "login" : initialMode);
  const [message, setMessage] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const [generatedToken, setGeneratedToken] = useState("");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy text-white">
      <AuthBackground />

      <div className="relative z-10 grid w-full max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[1.1fr_1fr]">
        <div className="hidden flex-col gap-8 lg:flex">
          <BrandHeader />
          <div className="space-y-4">
            <Badge tone="ai" className="px-3 py-1">
              <Sparkles className="size-3.5" /> AI inventory operating system
            </Badge>
            <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight">
              The premium control room for{" "}
              <span className="ai-text">multi-warehouse</span> inventory ops.
            </h1>
            <p className="max-w-lg text-base text-white/70">
              Discrepancy detection, AI-generated reports, mobile counting, and a tightly choreographed
              workflow for every role on your team.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FeatureChip label="Multi-tenant" hint="Company workspaces" />
            <FeatureChip label="AI insights" hint="Anomaly detection" tone="ai" />
            <FeatureChip label="Mobile native" hint="Compteur counting" />
          </div>

          <div className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Trusted by ops teams</p>
            <p className="mt-2 text-sm text-white/80">
              "Optima cut our annual inventory cycle from 9 days to 36 hours and surfaced anomalies we
              never used to catch."
            </p>
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative w-full overflow-hidden rounded-[var(--radius-xl)] border border-white/10 bg-white/[0.06] p-6 shadow-[0_30px_120px_-40px_rgb(0_0_0/0.7)] backdrop-blur-2xl sm:p-8"
        >
          <div className="lg:hidden">
            <BrandHeader />
            <div className="my-6 h-px bg-white/10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">{TITLES[mode].title}</h2>
            <p className="text-sm text-white/60">{TITLES[mode].subtitle}</p>
          </div>

          <AnimatePresence mode="wait">
            {mode === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                <LoginForm
                  onSuccess={onLogin}
                  onForgot={() => {
                    setMode("forgot");
                    setMessage(null);
                  }}
                  setMessage={setMessage}
                />
              </motion.div>
            )}
            {mode === "forgot" && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                <ForgotForm
                  onSent={(token) => {
                    if (token) setGeneratedToken(token);
                  }}
                  goLogin={() => setMode("login")}
                  setMessage={setMessage}
                />
              </motion.div>
            )}
            {mode === "reset" && (
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                <ResetForm
                  initialToken={resetToken || generatedToken}
                  onDone={() => {
                    setMode("login");
                    setMessage({ tone: "success", text: "Password reset. Please sign in." });
                  }}
                  setMessage={setMessage}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {message && (
            <div className="mt-4">
              <Notice tone={message.tone === "error" ? "error" : "success"}>{message.text}</Notice>
            </div>
          )}

          {generatedToken && mode !== "reset" && (
            <div className="mt-4 rounded-[var(--radius-md)] border border-amber/30 bg-amber/10 p-3 text-sm">
              <p className="font-semibold text-amber">Development reset token</p>
              <p className="mt-0.5 break-all font-mono text-xs text-amber/90">{generatedToken}</p>
              <button
                type="button"
                onClick={() => {
                  setMode("reset");
                  setMessage(null);
                }}
                className="mt-2 text-xs font-bold text-amber underline-offset-4 hover:underline"
              >
                Reset password with this token
              </button>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between text-xs text-white/60">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald" />
              SOC2-ready • Encrypted at rest
            </div>
            {mode !== "login" && (
              <button
                onClick={() => {
                  setMode("login");
                  setMessage(null);
                }}
                className="flex items-center gap-1 font-semibold text-white/70 transition-colors hover:text-white"
              >
                <ArrowLeft className="size-3" /> Back to sign in
              </button>
            )}
          </div>
        </motion.section>
      </div>
    </main>
  );
}

function FeatureChip({
  label,
  hint,
  tone,
}: {
  label: string;
  hint: string;
  tone?: "ai";
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-white/10 bg-white/5 p-3 backdrop-blur",
        tone === "ai" &&
          "border-transparent bg-gradient-to-br from-ai-from/30 via-indigo/20 to-ai-to/30",
      )}
    >
      <p className="text-sm font-bold">{label}</p>
      <p className="text-[11px] text-white/60">{hint}</p>
    </div>
  );
}

function LoginForm({
  onSuccess,
  onForgot,
  setMessage,
}: {
  onSuccess: (user: User) => void;
  onForgot: () => void;
  setMessage: (m: { tone: "success" | "error" | "info"; text: string } | null) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const submit = form.handleSubmit(async (values) => {
    setMessage(null);
    try {
      const data = await authService.login(values.email, values.password);
      onSuccess(data.user);
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Authentication failed",
      });
    }
  });

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
      <FormRow
        icon={<Mail className="size-4" />}
        label="Work email"
        error={form.formState.errors.email?.message}
      >
        <Input
          {...form.register("email")}
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          className="border-white/15 bg-white/5 pl-10 text-white placeholder:text-white/30 focus-visible:border-white/40"
        />
      </FormRow>
      <FormRow
        icon={<Lock className="size-4" />}
        label="Password"
        error={form.formState.errors.password?.message}
        suffix={
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
      >
        <Input
          {...form.register("password")}
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="current-password"
          className="border-white/15 bg-white/5 pl-10 pr-10 text-white placeholder:text-white/30 focus-visible:border-white/40"
        />
      </FormRow>

      <div className="flex items-center justify-between text-xs text-white/60">
        <button
          type="button"
          onClick={onForgot}
          className="font-semibold text-white/80 transition-colors hover:text-white"
        >
          Forgot password?
        </button>
      </div>

      <Button
        type="submit"
        size="lg"
        variant="ai"
        disabled={form.formState.isSubmitting}
        className="mt-2"
      >
        {form.formState.isSubmitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        Sign in
        <ArrowRight className="ml-auto size-4" />
      </Button>
    </form>
  );
}

function ForgotForm({
  onSent,
  goLogin,
  setMessage,
}: {
  onSent: (token?: string) => void;
  goLogin: () => void;
  setMessage: (m: { tone: "success" | "error" | "info"; text: string } | null) => void;
}) {
  const form = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const submit = form.handleSubmit(async (values) => {
    setMessage(null);
    try {
      const data = await authService.forgotPassword(values.email);
      setMessage({ tone: "success", text: data.message });
      onSent(data.token);
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not send reset email",
      });
    }
  });

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
      <FormRow
        icon={<Mail className="size-4" />}
        label="Email"
        error={form.formState.errors.email?.message}
      >
        <Input
          {...form.register("email")}
          type="email"
          placeholder="you@company.com"
          className="border-white/15 bg-white/5 pl-10 text-white placeholder:text-white/30 focus-visible:border-white/40"
        />
      </FormRow>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={goLogin} className="flex-1">
          <ArrowLeft className="size-4" /> Cancel
        </Button>
        <Button type="submit" variant="ai" className="flex-1" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <KeyRound className="size-4" />
          )}
          Send link
        </Button>
      </div>
    </form>
  );
}

function ResetForm({
  initialToken,
  onDone,
  setMessage,
}: {
  initialToken: string;
  onDone: () => void;
  setMessage: (m: { tone: "success" | "error" | "info"; text: string } | null) => void;
}) {
  const form = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { token: initialToken, password: "", confirm: "" },
  });

  const submit = form.handleSubmit(async (values) => {
    setMessage(null);
    try {
      await authService.resetPassword(values.token, values.password);
      onDone();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not reset password",
      });
    }
  });

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
      <FormRow
        icon={<KeyRound className="size-4" />}
        label="Reset token"
        error={form.formState.errors.token?.message}
      >
        <Input
          {...form.register("token")}
          placeholder="Token from your email"
          className="border-white/15 bg-white/5 pl-10 font-mono text-xs text-white placeholder:text-white/30 focus-visible:border-white/40"
        />
      </FormRow>
      <FormRow
        icon={<Lock className="size-4" />}
        label="New password"
        error={form.formState.errors.password?.message}
      >
        <Input
          {...form.register("password")}
          type="password"
          placeholder="••••••••"
          className="border-white/15 bg-white/5 pl-10 text-white placeholder:text-white/30 focus-visible:border-white/40"
        />
      </FormRow>
      <FormRow
        icon={<Lock className="size-4" />}
        label="Confirm password"
        error={form.formState.errors.confirm?.message}
      >
        <Input
          {...form.register("confirm")}
          type="password"
          placeholder="••••••••"
          className="border-white/15 bg-white/5 pl-10 text-white placeholder:text-white/30 focus-visible:border-white/40"
        />
      </FormRow>
      <Button type="submit" variant="ai" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
        Reset password
      </Button>
    </form>
  );
}

function FormRow({
  label,
  icon,
  suffix,
  error,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-white/70">{label}</Label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
            {icon}
          </span>
        )}
        {children}
        {suffix}
      </div>
      {error && <p className="text-xs font-medium text-rose-400">{error}</p>}
    </div>
  );
}
