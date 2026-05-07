import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Map as MapIcon,
  Sparkles,
  Smartphone,
  ShieldCheck,
  UserCheck,
  Warehouse,
} from "lucide-react";
import { trialRequestService } from "@/api/services";
import { AuthBackground } from "@/components/auth/AuthBackground";
import { BrandHeader } from "@/components/auth/BrandHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { Badge } from "@/components/ui/Badge";

const schema = z.object({
  companyName: z.string().min(2, "Required"),
  legalName: z.string().optional(),
  adminName: z.string().min(2, "Required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  message: z.string().optional(),
});

const features = [
  {
    icon: Warehouse,
    title: "Multi-warehouse",
    body: "Centralise every site, with map-pinned locations and per-warehouse roles.",
  },
  {
    icon: ClipboardList,
    title: "Inventory workflow",
    body: "Assign counters, upload technical CSVs, and reconcile with one click.",
  },
  {
    icon: Sparkles,
    title: "AI insights",
    body: "Anomaly detection, summaries, and recommended actions on every report.",
    accent: true,
  },
  {
    icon: Smartphone,
    title: "Mobile counting",
    body: "Native Compteur app for fast, blind, offline-friendly counting.",
  },
  {
    icon: BarChart3,
    title: "Operational KPIs",
    body: "Live accuracy, variance, and progress dashboards for every workspace.",
  },
  {
    icon: UserCheck,
    title: "Role-based access",
    body: "SuperAdmin, Admin, Gestionnaire, and Compteur — each gets a tailored UX.",
  },
];

const stats = [
  { value: "98.7%", label: "Counting accuracy" },
  { value: "5x", label: "Faster cycle" },
  { value: "12+", label: "Industries served" },
];

export function LandingPage({ navigate }: { navigate: (path: string) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: "",
      legalName: "",
      adminName: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  const submit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await trialRequestService.create(values);
      setSubmitted(true);
      form.reset();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not submit your request");
    }
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-navy text-white">
      <AuthBackground />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <BrandHeader />
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate("/login")}>
            Sign in
          </Button>
          <Button variant="ai" size="sm" asChild>
            <a href="#trial">
              Request access <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-10 px-6 pb-20 pt-12 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
          className="flex flex-col gap-6"
        >
          <Badge tone="ai" className="w-fit px-3 py-1">
            <Sparkles className="size-3.5" /> Optima Inventory · 2026 Edition
          </Badge>
          <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            The premium <span className="ai-text">AI inventory</span> operating system for ops teams.
          </h1>
          <p className="max-w-xl text-base text-white/70">
            Optima centralises warehouses, articles, counters, and AI reports into one breathtaking
            workspace. Count faster, find anomalies sooner, and close inventory cycles with confidence.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ai" size="lg" asChild>
              <a href="#trial">
                Start free trial <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate("/login")}>
              Open back office
            </Button>
            <Button variant="ghost" size="lg" onClick={() => navigate("/mobile")}>
              Mobile access
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-6 border-t border-white/10 pt-6">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="ai-text text-2xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-xs uppercase tracking-wider text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <DashboardPreview />
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">Why Optima</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Every step of the inventory cycle, intelligently choreographed.
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
              className={`relative overflow-hidden rounded-[var(--radius-lg)] border border-white/10 p-5 backdrop-blur-xl ${
                feature.accent
                  ? "bg-gradient-to-br from-ai-from/20 via-indigo/10 to-ai-to/20"
                  : "bg-white/[0.04]"
              }`}
            >
              <span
                className={`mb-4 inline-flex size-10 items-center justify-center rounded-xl ${
                  feature.accent
                    ? "ai-gradient text-white shadow-[0_8px_24px_-8px_rgb(var(--ai-from)/0.6)]"
                    : "bg-white/10 text-white"
                }`}
              >
                <feature.icon className="size-5" />
              </span>
              <h3 className="text-base font-bold">{feature.title}</h3>
              <p className="mt-1 text-sm text-white/65">{feature.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section
        id="trial"
        className="relative z-10 mx-auto grid max-w-7xl gap-8 px-6 pb-24 lg:grid-cols-[1fr_1.05fr]"
      >
        <div className="flex flex-col gap-6">
          <Badge tone="ai" className="w-fit">
            <Sparkles className="size-3.5" /> Get started
          </Badge>
          <h2 className="text-balance text-4xl font-bold tracking-tight">
            Request your{" "}
            <span className="ai-text">company workspace</span>.
          </h2>
          <p className="max-w-md text-white/70">
            A SuperAdmin reviews each request and provisions a fully-isolated workspace with your
            admin account, ready to import warehouses and articles.
          </p>
          <ul className="flex flex-col gap-3 text-sm text-white/80">
            {[
              "Multi-tenant isolation by company",
              "CSV import for articles and technical stock",
              "AI insights on every inventory cycle",
              "Mobile-native counting for your team",
            ].map((point) => (
              <li key={point} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 text-emerald" />
                {point}
              </li>
            ))}
          </ul>
          <div className="rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60">
              <ShieldCheck className="size-3.5 text-emerald" /> Enterprise-grade security
            </div>
            <p className="mt-1.5 text-sm text-white/75">
              JWT authentication via HTTP-only cookies, role-based permissions, and encrypted credentials at rest.
            </p>
          </div>
        </div>

        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
          className="rounded-[var(--radius-xl)] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-2xl sm:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name" error={form.formState.errors.companyName?.message}>
              <Input
                {...form.register("companyName")}
                placeholder="Acme Corp"
                className="border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-white/40"
              />
            </Field>
            <Field label="Legal name (optional)">
              <Input
                {...form.register("legalName")}
                placeholder="Acme S.A."
                className="border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-white/40"
              />
            </Field>
            <Field label="Admin name" error={form.formState.errors.adminName?.message}>
              <Input
                {...form.register("adminName")}
                placeholder="Jane Smith"
                className="border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-white/40"
              />
            </Field>
            <Field label="Work email" error={form.formState.errors.email?.message}>
              <Input
                {...form.register("email")}
                type="email"
                placeholder="jane@acme.com"
                className="border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-white/40"
              />
            </Field>
            <Field label="Phone (optional)">
              <Input
                {...form.register("phone")}
                placeholder="+1 555 123 4567"
                className="border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-white/40"
              />
            </Field>
            <Field label="Team size (optional)">
              <Input
                {...form.register("message")}
                placeholder="e.g. 25 counters across 4 sites"
                className="border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-white/40"
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="What would you like to achieve? (optional)">
              <Textarea
                rows={3}
                placeholder="Tell us about your inventory operations…"
                className="border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-white/40"
              />
            </Field>
          </div>

          {submitted && (
            <Notice tone="success" className="mt-4" title="Request received">
              A SuperAdmin will review your request and provision your workspace shortly.
            </Notice>
          )}
          {submitError && (
            <Notice tone="error" className="mt-4">
              {submitError}
            </Notice>
          )}

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-xs text-white/55">
              By requesting access, you agree to our terms and a 14-day evaluation window.
            </p>
            <Button type="submit" variant="ai" size="lg" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Request access
            </Button>
          </div>
        </motion.form>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <span>© 2026 Optima Inventory</span>
            <span>·</span>
            <span>AI-powered SaaS</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/login")} className="hover:text-white">
              Sign in
            </button>
            <button onClick={() => navigate("/mobile")} className="hover:text-white">
              Mobile
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-white/70">{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-rose-400">{error}</p>}
    </div>
  );
}

function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative"
    >
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-ai-from/30 via-primary/20 to-ai-to/30 blur-2xl" />
      <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-white/10 bg-white/[0.04] p-4 shadow-[0_30px_120px_-40px_rgb(0_0_0/0.7)] backdrop-blur-2xl">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <span className="size-2.5 rounded-full bg-rose-400" />
          <span className="size-2.5 rounded-full bg-amber" />
          <span className="size-2.5 rounded-full bg-emerald" />
          <span className="ml-2 text-xs text-white/50">optima.ai/app</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <PreviewCard
            icon={<Warehouse className="size-4" />}
            label="Warehouses"
            value="14"
          />
          <PreviewCard
            icon={<Boxes className="size-4" />}
            label="Articles"
            value="38,210"
          />
          <PreviewCard
            icon={<ClipboardList className="size-4" />}
            label="Open inventories"
            value="6"
          />
        </div>
        <div className="mt-3 rounded-[var(--radius-md)] border border-white/10 bg-gradient-to-br from-ai-from/20 via-indigo/10 to-ai-to/20 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/80">
            <Sparkles className="size-3.5" /> AI summary
          </div>
          <p className="text-sm leading-relaxed text-white/80">
            Inventory <span className="font-bold text-white">INV-2412</span> shows a 4.7% variance in
            warehouse <span className="font-bold text-white">Casablanca North</span>. 3 SKUs flagged
            for potential miscount.
          </p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-[var(--radius-md)] border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              Counting progress
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "73%" }}
                transition={{ duration: 1.2, delay: 0.4 }}
                className="ai-gradient h-full"
              />
            </div>
            <p className="mt-1.5 text-xs text-white/70">
              <span className="text-white">2,184</span> / 2,990 counted
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Map sync</p>
            <div className="mt-1 flex items-center gap-2 text-sm text-white/85">
              <MapIcon className="size-4 text-emerald" /> 14 pins live
            </div>
            <p className="mt-1 text-[11px] text-white/50">Updated 2 minutes ago</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PreviewCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-white/10 bg-white/5 p-3">
      <div className="mb-2 flex size-7 items-center justify-center rounded-lg bg-white/10 text-white">
        {icon}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">{label}</p>
      <p className="mt-0.5 text-xl font-bold tabular">{value}</p>
    </div>
  );
}
