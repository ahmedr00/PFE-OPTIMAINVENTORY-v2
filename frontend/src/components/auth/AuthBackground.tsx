import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export function AuthBackground({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy to-[#08111f]" />

      <div className="absolute inset-0 opacity-[0.18]" style={gridStyle} />

      <motion.div
        animate={{
          x: [0, 60, 0],
          y: [0, -30, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-32 top-12 size-[480px] rounded-full bg-[radial-gradient(circle_at_center,rgb(99_102_241/0.55),transparent_60%)] blur-3xl"
      />
      <motion.div
        animate={{
          x: [0, -50, 0],
          y: [0, 40, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute -right-32 top-56 size-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgb(168_85_247/0.55),transparent_60%)] blur-3xl"
      />
      <motion.div
        animate={{
          x: [0, 40, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: 6 }}
        className="absolute -bottom-24 left-1/2 size-[600px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgb(59_130_246/0.4),transparent_60%)] blur-3xl"
      />

      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy via-navy/80 to-transparent" />
    </div>
  );
}

const gridStyle: React.CSSProperties = {
  backgroundImage: `linear-gradient(rgb(255 255 255 / 0.06) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.06) 1px, transparent 1px)`,
  backgroundSize: "44px 44px",
  maskImage: "radial-gradient(ellipse at top, black, transparent 70%)",
  WebkitMaskImage: "radial-gradient(ellipse at top, black, transparent 70%)",
};
